const noble = require('@abandonware/noble');
const bleno = require('@abandonware/bleno');
const fs = require('fs');
const util = require('util');
const path = require('path');
const { EventEmitter } = require('events');

const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

var BlenoPrimaryService = bleno.PrimaryService;
var BlenoCharacteristic = bleno.Characteristic;

class BluetoothFileExchangerCentral extends EventEmitter {
    constructor(serviceUUID, characteristicUUID, outputDirectory) {
        super();
        this.serviceUUID = serviceUUID;
        this.characteristicUUID = characteristicUUID;
        this.outputDirectory = outputDirectory;

        noble.on('stateChange', this.stateChangeHandler.bind(this));
        noble.on('discover', this.discoverHandler.bind(this));

        if (noble.state === 'poweredOn') {
            console.log('Scanning');
            noble.startScanningAsync([this.serviceUUID], true);
        }
    }

    async disable() {
        await noble.stopScanningAsync();
        noble.removeAllListeners();
        console.log('(noble) disabling');
    }

    async stateChangeHandler(state) {
        console.log('(noble) on -> stateChange: ' + state);
        this.emit('stateChange', state);

        if (state === 'poweredOn') {
            console.log('Scanning');
            await noble.startScanningAsync([this.serviceUUID], true);
        } else {
            await noble.stopScanningAsync();
        }
    }

    discoverHandler(peripheral) {
        this.emit('discover', peripheral);
        peripheral.once('disconnect', () => this.emit('disconnect', peripheral));
    }

    async receive(peripheral) {
        await noble.stopScanningAsync();
        await peripheral.connectAsync();

        const characteristics = await new Promise((resolve, reject) => {
            peripheral.discoverSomeServicesAndCharacteristics(
                [this.serviceUUID],
                [this.characteristicUUID],
                (error, services, characteristics) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve(characteristics);
                }
            );
        });
        const characteristic = characteristics[0];

        const data = await new Promise((resolve, reject) => {
            characteristic.read((error, data) => {
                if (error) {
                    reject(error)
                    return;
                }
                resolve(data);
            });
        });

        await writeFile(path.join(this.outputDirectory(), peripheral.advertisement.localName + '-data.csv'), data);
        await peripheral.disconnectAsync();
        await noble.startScanningAsync();
    }
}

class BluetoothFileExchangerPeripheral extends EventEmitter {
    shouldStartAdvertising = false;

    constructor(serviceUUID, characteristicUUID, peripheralName, filePathSupplier, startAdvertising) {
        super();
        this.serviceUUID = serviceUUID;
        this.characteristicUUID = characteristicUUID;
        this.peripheralName = peripheralName;
        this.filePathSupplier = filePathSupplier;

        bleno.on('stateChange', this.stateChangeHandler.bind(this));
        bleno.on('advertisingStart', this.advertisingStartHandler.bind(this));
        bleno.on('accept', this.acceptHandler.bind(this));

        if (bleno.state === 'poweredOn' && startAdvertising) {
            this.startAdvertising();
        }
        this.shouldStartAdvertising = startAdvertising;
    }

    async disable() {
        await this.stopAdvertising();
        bleno.removeAllListeners();
    }

    async stopAdvertising() {
        console.log('(bleno) on -> advertisingStop');
        bleno.stopAdvertising();
        this.shouldStartAdvertising = false;
    }

    startAdvertising() {
        console.log('(bleno) on -> advertisingStart');
        bleno.startAdvertising(this.peripheralName, [this.serviceUUID]);
        this.shouldStartAdvertising = true;
    }

    stateChangeHandler(state) {
        this.emit('stateChange', state);
        console.log('(bleno) on -> stateChange: ' + state);

        if (state === 'poweredOn' && this.shouldStartAdvertising) {
            this.startAdvertising();
        } else {
            bleno.stopAdvertising();
        }
    }

    advertisingStartHandler(error) {
        console.log('(bleno) on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

        if (!error) {
            bleno.setServices([
                new BlenoPrimaryService({
                    uuid: this.serviceUUID,
                    characteristics: [
                        new FileExchangeCharacteristic(
                            this.characteristicUUID,
                            this.filePathSupplier,
                            {
                                onSend: () => this.emit('send'),
                                onSent: () => this.emit('sent')
                            }
                        )
                    ]
                })
            ]);
        }
    }

    acceptHandler(deviceAddress) {
        this.emit('connect', deviceAddress);
    }
}

class FileExchangeCharacteristic extends BlenoCharacteristic {
    constructor(characteristicUUID, filePathSupplier, callbacks) {
        super({
            uuid: characteristicUUID,
            properties: ['read']
        });

        this.onSend = callbacks.onSend;
        this.onSent = callbacks.onSent;
        this.filePathSupplier = filePathSupplier;
    }

    async onReadRequest(offset, callback) {
        console.log('FileExchangeCharacteristic - onReadRequest');
        this.onSend();

        let fileData;
        try {
            fileData = await readFile(this.filePathSupplier());
        } catch (err) {
            console.log(err);
            callback(this.RESULT_UNLIKELY_ERROR, 'Error');
            this.onSent();
            return;
        }

        callback(this.RESULT_SUCCESS, fileData);
        this.onSent();
    }
}

function sleep(millis) {
    return new Promise((resolve, _) => setTimeout(resolve, millis));
}

module.exports = {
    BluetoothFileExchangerCentral,
    BluetoothFileExchangerPeripheral,
};
