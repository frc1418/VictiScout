const bleno = require('@abandonware/bleno');

const ECHO_SERVICE_UUID = 'ec00';
const ECHO_CHARACTERISTIC_UUID = 'ec0e';

var BlenoPrimaryService = bleno.PrimaryService;
var BlenoCharacteristic = bleno.Characteristic;

console.log('bleno - echo');

bleno.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state);

  if (state === 'poweredOn') {
    bleno.startAdvertising('echo', [ECHO_SERVICE_UUID]);
  } else {
    bleno.stopAdvertising();
  }
});

bleno.on('advertisingStart', function(error) {
  console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

  if (!error) {
    bleno.setServices([
      new BlenoPrimaryService({
        uuid: ECHO_SERVICE_UUID,
        characteristics: [
          new EchoCharacteristic()
        ]
      })
    ]);
  }
});

class EchoCharacteristic extends BlenoCharacteristic {
    constructor() {
        super({
            uuid: ECHO_CHARACTERISTIC_UUID,
            properties: ['read', 'write', 'notify'],
            value: null
        });

        this._value = new Buffer.alloc(0);
        this._updateValueCallback = null;
    }

    onReadRequest(offset, callback) {
        console.log('EchoCharacteristic - onReadRequest: value = ' + this._value.toString('hex'));

        callback(this.RESULT_SUCCESS, this._value);
    }

    onWriteRequest(data, offset, withoutResponse, callback) {
        this._value = data;

        console.log('EchoCharacteristic - onWriteRequest: value = ' + this._value.toString('hex'));

        if (this._updateValueCallback) {
            console.log('EchoCharacteristic - onWriteRequest: notifying');

            this._updateValueCallback(this._value);
        }

        callback(this.RESULT_SUCCESS);
    }

    onSubscribe(maxValueSize, updateValueCallback) {
        console.log('EchoCharacteristic - onSubscribe');
      
        this._updateValueCallback = updateValueCallback;
    }

    onUnsubscribe() {
        console.log('EchoCharacteristic - onUnsubscribe');
      
        this._updateValueCallback = null;
    }
}