export class CocorokitPlus {
  static get HIGH() {
    return 1;
  }

  static get LOW() {
    return 0;
  }

  static get PULLUP() {
    return 1;
  }

  static get NO_PULLS() {
    return 0;
  }

  static get PWM0() {
    return 0;
  }

  static get PWM1() {
    return 1;
  }

  static get PWM2() {
    return 2;
  }

  static get PWM3() {
    return 3;
  }

  static get LED_R() {
    return 0;
  }

  static get LED_G() {
    return 1;
  }

  static get LED_B() {
    return 2;
  }

  static get SENSOR1() {
    return 3;
  }

  static get SENSOR2() {
    return 4;
  }

  static get PWM_DISABLE() {
    return 0;
  }

  static get PWM_ENABLE() {
    return 1;
  }

  static get PWM_LED_PERIOD() {
    return 10000;
  }

  static get NOT_MOVE() {
    return 30000;
  }

  /**
   * @param {String} part
   */
  static _createUUID(part) {
    return "229b" + part + "-03fb-40da-98a7-b0def65c2d4b";
  }

  static get _serviceUUID() {
    return CocorokitPlus._createUUID("ff00");
  }

  static deg2value(degree) {
    if (degree > 180) degree = 180;
    if (degree < 0) degree = 0;

    let value = 1450;

    if (degree == 90) {
      value = 1450;
    } else if (degree > 90) {
      value = 1450 + ((degree - 90) * (2300 - 1450)) / 90;
    } else {
      value = 1450 - ((90 - degree) * (1450 - 600)) / 90;
    }

    return value;
  }

  static get defaultFilter() {
    return {
      filters: [
        {
          namePrefix: "cocorokit+",
        },
      ],
      optionalServices: [CocorokitPlus._serviceUUID],
    };
  }

  /**
   * Find and connect cocorokit+
   * @param {Object} options default: CocorokitPlus.defaultFilter
   */
  static async find(options = CocorokitPlus.defaultFilter) {
    const device = await navigator.bluetooth.requestDevice(options);
    const c = new CocorokitPlus(device);

    await c._connect().catch(async (error) => {
      if (/retrieve services/.test(error)) {
        await c._connect();
      }
    });

    c._initialize();

    return c;
  }

  constructor(device) {
    this._device = device;
    this._gatt = null;
    this._service = null;
    this._c12c = {};
    this._pioOutputs = 0;
  }

  get _c12cUUIDs() {
    return {
      pioSetting: CocorokitPlus._createUUID("3000"),
      pioPullUp: CocorokitPlus._createUUID("3001"),
      pioOutput: CocorokitPlus._createUUID("3002"),
      pioInputNotification: CocorokitPlus._createUUID("3003"),
      pwmConfig: CocorokitPlus._createUUID("3004"),
      pwmParameter: CocorokitPlus._createUUID("3005"),
      pwmDuty: CocorokitPlus._createUUID("3006"),
      hardPwmConfig: CocorokitPlus._createUUID("3007"),
      hardPwmDuty: CocorokitPlus._createUUID("3008"),
      hardPwmDutyAll: CocorokitPlus._createUUID("3009"),
      hardPwmDutyTime: CocorokitPlus._createUUID("3010"),
      softwareReset: CocorokitPlus._createUUID("3013"),
      hardwareReset: CocorokitPlus._createUUID("3014"),
      hardwareLowBatteryNotification: CocorokitPlus._createUUID("3015"),
    };
  }

  /**
   * @private
   */
  async _connect() {
    this._gatt = await this._device.gatt.connect().catch((e) => this._throwError(e));
    this._service = await this._gatt.getPrimaryService(CocorokitPlus._serviceUUID).catch((e) => this._throwError(e));

    for (const uuid in this._c12cUUIDs) {
      const c = await this._service.getCharacteristic(this._c12cUUIDs[uuid]).catch((e) => this._throwError(e));
      this._c12c[uuid] = c;
    }
  }

  /**
   * @private
   */
  async _initialize() {
    await this._pinModeAll(0b000000111);
    await this._pwmMode(CocorokitPlus.LED_R, CocorokitPlus.PWM_ENABLE);
    await this._pwmMode(CocorokitPlus.LED_G, CocorokitPlus.PWM_ENABLE);
    await this._pwmMode(CocorokitPlus.LED_B, CocorokitPlus.PWM_ENABLE);
    await this._hardPwmModeAll(0b00001111);
  }

  disconnect() {
    this._gatt.disconnect();
  }

  get isConnected() {
    let connected = false;
    if (this._gatt) {
      connected = this._gatt.connected;
    }
    return connected;
  }

  get deviceName() {
    return this._device.name;
  }

  /**
   * @private
   * @param {Number} modes 0x00-0x1F 0:INPUT, 1:OUTPUT
   */
  async _pinModeAll(modes) {
    if (modes >= 0x00 && modes <= 0x1f) {
      await this._c12c.pioSetting.writeValue(new Uint8Array([modes])).catch((e) => this._throwError(e));
    }
  }

  /**
   * Set cocorokit+ Sensor Input pin pullup mode
   * @param {Number} pin CocorokitPlus.SENSOR(1,2)
   * @param {Number} mode CocorokitPlus.(PULLUP|NO_PULLS)
   */
  async pinPullUp(pin, mode) {
    if (pin != this.SENSOR1 && pin != this.SENSOR2) return;

    const value = await this._c12c.pioPullUp.readValue().catch((e) => this._throwError(e));
    let modes = value.getUint8(0);

    if (mode === CocorokitPlus.PULLUP) {
      modes |= 0x01 << pin;
    } else {
      modes &= ~(0x01 << pin) & 0xff;
    }

    await this._c12c.pioPullUp.writeValue(new Uint8Array([modes])).catch((e) => this._throwError(e));
  }

  /**
   * @param {Number} pin CocorokitPlus.(SENSOR1|SENSOR2)
   * @returns {Number} CocorokitPlus.(LOW|HIGH)
   */
  async digitalRead(pin) {
    if (pin != this.SENSOR1 && pin != this.SENSOR2) return;

    const value = await this._c12c.pioInputNotification.readValue().catch((e) => this._throwError(e));

    return (value.getUint8(0) >> pin) & 0x01;
  }

  /**
   * @param {Function<Number>} callback arguments is 0bXXXXXXXX.
   */
  async startDigitalInputNotification(callback) {
    this.onReceived = (event) => {
      const value = event.target.value;
      callback(value.getUint8(0));
    };

    await this._c12c.pioInputNotification
      .startNotifications()
      .then((_) => {
        this._c12c.pioInputNotification.addEventListener("characteristicvaluechanged", this.onReceived);
      })
      .catch((e) => {
        this._throwError(e);
      });
  }

  /**
   * Stop digital input Notification
   */
  async stopDigitalInputNotification() {
    await this._c12c.pioInputNotification.stopNotifications().catch((e) => this._throwError(e));
    this._c12c.pioInputNotification.removeEventListener("characteristicvaluechanged", this.onReceived);
  }

  /**
   * @private
   * @param {Number} pin CocorokitPlus.LED_(R|G|B)
   * @param {Number} mode CocorokitPlus.(PWM_ENABLE|PWM_DISABLE)
   */
  async _pwmMode(pin, mode) {
    if (pin != CocorokitPlus.LED_R && pin != CocorokitPlus.LED_G && pin != CocorokitPlus.LED_B) return;

    const value = await this._c12c.pwmConfig.readValue().catch((e) => this._throwError(e));
    let modes = value.getUint8(0);

    if (mode === CocorokitPlus.PWM_ENABLE) {
      modes |= 0x01 << pin;
    } else {
      modes &= ~(0x01 << pin) & 0xff;
    }

    await this._c12c.pwmConfig.writeValue(new Uint8Array([modes])).catch((e) => this._throwError(e));
    await this._pwmPeriod(pin, CocorokitPlus.PWM_LED_PERIOD).catch((e) => this._throwError(e));
    await this._pwmDuty(pin, 0).catch((e) => this._throwError(e));
  }

  /**
   * @private
   * @param {Number} pin
   * @param {Number} period
   */
  async _pwmPeriod(pin, period) {
    const data = new Uint8Array([pin, (period >> 24) & 0xff, (period >> 16) & 0xff, (period >> 8) & 0xff, (period >> 0) & 0xff]);

    await this._c12c.pwmParameter.writeValue(data).catch((e) => this._throwError(e));
  }

  /**
   * @private
   * @param {Number} pin
   * @param {Number} duty
   */
  async _pwmDuty(pin, duty) {
    const dutyNum = parseInt(duty);
    const data = new Uint8Array([pin, (dutyNum >> 24) & 0xff, (dutyNum >> 16) & 0xff, (dutyNum >> 8) & 0xff, (dutyNum >> 0) & 0xff]);
    await this._c12c.pwmDuty.writeValue(data).catch((e) => this._throwError(e));
  }

  /**
   * @param {Number} pin CocorokitPlus.LED_(R|G|B)
   * @param {Number} power (0 - 100)
   */
  async setLED(pin, power) {
    const rate = Math.min(100.0, Math.max(0.0, power));
    const duty = (CocorokitPlus.PWM_LED_PERIOD * rate) / 100;
    await this._pwmDuty(pin, duty).catch((e) => this._throwError(e));
  }

  /**
   * @private
   * @param {*} modes 0x00-0x0F 0:Disable, 1:Enable
   */
  async _hardPwmModeAll(modes) {
    if (modes >= 0x00 && modes <= 0x0f) {
      await this._c12c.hardPwmConfig.writeValue(new Uint8Array([modes])).catch((e) => this._throwError(e));
    }
  }

  /**
   * @param {Number} pin CocorokitPlus.PWM(0-4)
   * @param {Number} duty
   */
  async setPwmDuty(pin, duty) {
    var data = new Uint8Array([pin, (duty >> 8) & 0xff, (duty >> 0) & 0xff]);
    await this._c12c.hardPwmDuty.writeValue(data).catch((e) => this._throwError(e));
  }

  /**
   * @param {Number} duty0
   * @param {Number} duty1
   * @param {Number} duty2
   * @param {Number} duty3
   */
  async setPwmDutyAll(duty0, duty1, duty2, duty3) {
    const data = new Uint8Array([
      (duty0 >> 8) & 0xff,
      (duty0 >> 0) & 0xff,
      (duty1 >> 8) & 0xff,
      (duty1 >> 0) & 0xff,
      (duty2 >> 8) & 0xff,
      (duty2 >> 0) & 0xff,
      (duty3 >> 8) & 0xff,
      (duty3 >> 0) & 0xff,
    ]);

    await this._c12c.hardPwmDutyAll.writeValue(data).catch((e) => this._throwError(e));
  }

  /**
   * @param {Number} pin CocorokitPlus.PWM(0-4)
   * @param {Number} duty [us]
   * @param {Number} duration 0 - 65535[msec]
   */
  async changePwmDutyTime(pin, duty, duration) {
    var data = new Uint8Array([pin, (duty >> 8) & 0xff, (duty >> 0) & 0xff, (duration >> 8) & 0xff, (duration >> 0) & 0xff]);
    await this._c12c.hardPwmDutyTime.writeValue(data).catch((e) => this._throwError(e));
  }

  /**
   * Reset software
   */
  async softwareReset() {
    await this._c12c.softwareReset.writeValue(new Uint8Array([1]));
    await this._initialize();
  }

  /**
   * @private
   */
  _throwError(error) {
    console.log(error);
    throw error;
  }
}
