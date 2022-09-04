[English](/README_en.md)

# cocorokit+ JavaScript SDK

ココロキット＋を JavaScript と TypeScript から動かすための SDK

You can use cocorokit+ from JavaScript and TypeScript

## 必要要件 | Requirements

本 SDK は Web Bluetooth API を使っています。Web Bluetooth API は現在（2020-07-25）使えるブラウザが限られているため次のリンクから、ご利用の環境で利用できるかご確認ください(https://caniuse.com/#feat=web-bluetooth)。

This module uses Web BLuetooth API. The support of API is limited. Please confirm your device following the link (https://caniuse.com/#feat=web-bluetooth).

## 使い方 | How to use

ココロキット＋に接続して LED を赤色に光らせるサンプルです。

Connect to cocorokit+ and turn Red LED on.

```js
import CocorokitPlus from "@ux-xu/cocorokit-plus-js-sdk";

const ccrpls = CocorokitPlus.find(CocorokitPlus.defaultFilter);
ccrpls.setLED(CocorokitPlus.LED_R, 100);
```

## 関数の説明 | About funcitons

ココロキット＋との通信を必要とする関数は async / await で実装しています。

cocorokit+ JS SDK uses async / await function.

### サーボモータの操作 | Control servo motor (change duty)

```js
cocoro.setPwmDuty(CocorokitPlus.PWM0, 1450); // サーボ0 の duty を 1450 usec に変更 | change servo zero's duty to 1450 usec
cocoro.setPwmDutyAll(600, 600, 600, 600); // サーボ0 から 3 の duty を同時に 600usec に変更 | change all servos's duty to 600 usec simultaneously
cocoro.setPwmDutyTime(CocorokitPlus.PWM0, 2300, 2000); // 2000 ミリ秒に duty が 2300 usec になるようにサーボ0 を動かす | change servo zero's duty 2300 usec after 2000 milli seconds.
```

`setPwmDutyTime` は duty が変化する速度をゆっくりにしたいときに利用します。

You can use `setPwmDutyTime` when you want to change servo duty slowly.

### センサーの値の取得 | Get value of sensors

```js
const onChanged = (data) => {
  const input3 = (data >> 3) & 0x01;
  console.log(input3); // 0 or 1
  const input4 = (data >> 4) & 0x01;
  console.log(input4); // 0 or 1
};

cocoro.startDigitalInputNotification(onChanged);
```

ココロキット＋は、センサーの値が変化すると通知が送ります。  
通知された時に動かす関数を設定するコトでセンサの値に応じた操作が可能です。

data は 8bit の Unsigned Int 型で送られてきます。  
ココロキット＋のセンサ 1 とセンサ 2 は、3bit 目と 4bit 目に割り当てられています。

Cocorokit+ notify when digital input value changed. Please set callback function.

Callback functions arguments (data) is 8 bit unsigned int.
Sensor 1 is on 3bit and Sensor 2 is on 4bit.

### LED の表示 | turn on LED

LED は PWM 制御をしているため、明るさの強さを指定します。

Cocorokit+ control LED using PWM. Please set target LED and brightness (0-100).

```js
cocoro.setLED(CocorokitPlus.LED_R, 100); // 赤を最大強度で光らせる | bright Red LED by max power
cocoro.setLED(CocorokitPlus.LED_G, 50); // 緑を50％の強度で光らせる | bright Green LED by 50%
cocoro.setLED(CocorokitPlus.LED_R, 0); // 赤色を消す | turn Red LED off
```

