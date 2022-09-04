declare module "@ux-xu/cocorokit-plus-js-sdk" {
  class CocorokitPlus {
    static get HIGH(): number;
    static get LOW(): number;
    static get OUTPUT(): number;
    static get INPUT(): number;
    static get PULLUP(): number;
    static get NO_PULLS(): number;

    // pins
    static get PWM0(): number;
    static get PWM1(): number;
    static get PWM2(): number;
    static get PWM3(): number;
    static get LED_R(): number;
    static get LED_G(): number;
    static get LED_B(): number;
    static get SENSOR1(): number;
    static get SENSOR2(): number;

    // PWM
    static get PWM_DISABLE(): number;
    static get PWM_ENABLE(): number;
    static get PWM_ENABLE_LED_MODE(): number;
    static get PWM_LED_PERIOD(): number;
    
    // utils
    static get NOT_MOVE(): number;
    static deg2value(degree: number): number;

    static _createUUID(part: string): string;
    static get _serviceUUID(): string;
    static get defaultFilter(): object;
    static find(options: Object): Promise<CocorokitPlus>;

    constructor(device: BluetoothDevice);

    get _c12cUUIDs(): { [key: string]: string };

    private _connect(): void;
    private _initialize(): void;

    disconnect(): void;

    get isConnected(): boolean;
    get deviceName(): string;

    private _pinModeAll(modes: number): Promise<void>;
    private _pwmMode(pin: number, mode: number): Promise<void>;
    private _pwmPeripd(pin: number, period: number): Promise<void>;
    private _pwmDuty(pin: number, duty: number): Promise<void>;
    pinPullUp(pin: number, mode: number): Promise<void>;
    digitalRead(pin: number): Promise<number>;
    setLED(pin: number, power: number): Promise<void>;
    startDigitalInputNotification(callback: (arg0: number) => void): Promise<void>;
    stopDigitalInputNotification(): Promise<void>;

    private _hardPwmModeAll(modes: number): Promise<void>;
    setPwmDuty(pin: number, duty: number): Promise<void>;
    setPwmDutyAll(duty0: number, duty1: number, duty2: number, duty3: number): Promise<void>;
    changePwmDutyTime(pin: number, duty: number, duration: number): Promise<void>;

    softwareReset(): Promise<void>;
  }

  export default CocorokitPlus
}
