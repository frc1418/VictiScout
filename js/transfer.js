const { BluetoothFileExchangerCentral, BluetoothFileExchangerPeripheral } = require('./js/bluetooth.js');
const os = require('os');

const SERVICE_UUID = 'ec00';
const CHARACTERISTIC_UUID = 'ec0e';
const PERIPHERAL_NAME = 'VictiScout-' + os.hostname();
// Set both of these from UI
let outputDirectory = '~/Desktop';
let dataFile = '~/Desktop/data.json';
let central = true;

let fileExchanger;

async function setupBluetoothFileExchanger() {
    if (fileExchanger) {
        await fileExchanger.disable();
    }

    if (central) {
        fileExchanger = new BluetoothFileExchangerCentral(
            SERVICE_UUID,
            CHARACTERISTIC_UUID,
            outputDirectory
        );

        fileExchanger.on('discover', async (device) => {
            addDevice(device);
            // TODO: move this to an onclick for each device
            await sleep(3000);
            console.log('Receiving data');
            await fileExchanger.receive(device);
            console.log('Data received and written');
        });

        fileExchanger.on('disconnect', (device) => {
            removeDevice(device);
        })
    } else {
        fileExchanger = new BluetoothFileExchangerPeripheral(
            SERVICE_UUID,
            CHARACTERISTIC_UUID,
            PERIPHERAL_NAME,
            () => dataFile
        );
    }
}

setupBluetoothFileExchanger();

fileExchanger.on('stateChange', (state) => {
    console.log('(transfer)', 'State: ' + state);
});

function addDevice(device) {

}

function removeDevice(device) {

}

function sleep(millis) {
    return new Promise((resolve, _) => setTimeout(resolve, millis));
}