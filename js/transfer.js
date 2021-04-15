const { BluetoothFileExchangerCentral, BluetoothFileExchangerPeripheral } = require('./js/bluetooth.js');
const os = require('os');

const SERVICE_UUID = 'ec00';
const CHARACTERISTIC_UUID = 'ec0e';
const PERIPHERAL_NAME = 'VictiScout-' + os.userInfo().username;
// Set both of these from UI
let outputDirectory = localStorage.desktopPath;
let dataFile = localStorage.path;

let fileExchanger;
let devices = [];

const mainCheckbox = document.getElementById('main-checkbox');
mainCheckbox.onclick = () => {
    setupBluetoothFileExchanger(mainCheckbox.checked);
};

async function setupBluetoothFileExchanger(central) {
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
            if (devices.indexOf(device) !== -1) return;

            console.log('Discovered', device);
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

    fileExchanger.on('stateChange', (state) => {
        console.log('(transfer)', 'State: ' + state);
    });
}

setupBluetoothFileExchanger(false);


function addDevice(device) {
    devices.push(device);
}

function removeDevice(device) {
    devices.splice(devices.indexOf(device), 1);
}

function sleep(millis) {
    return new Promise((resolve, _) => setTimeout(resolve, millis));
}