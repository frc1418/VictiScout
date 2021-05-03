const { BluetoothFileExchangerCentral, BluetoothFileExchangerPeripheral } = require('./js/transfer/bluetooth.js');
const { Device } = require('./js/transfer/device.js');
const os = require('os');

const SERVICE_UUID = 'ec00';
const CHARACTERISTIC_UUID = 'ec0e';
const PERIPHERAL_NAME = 'VictiScout-' + os.userInfo().username;
// Set both of these from UI
let receiveDirectory = localStorage.desktopPath;
let dataFile = localStorage.path;

let fileExchanger;
let devices = [];

const elements = {
    main: document.getElementsByTagName('main')[0],
    status: document.getElementById('status-indicator'),
    deviceList: document.getElementById('device-list')
}

const statusStates = {
    'poweredOff': 'rgb(209, 39, 39)',
    'poweredOn': 'rgb(51, 186, 34)'
}

const mainCheckbox = document.getElementById('main-checkbox');
mainCheckbox.onclick = () => {
    setupBluetoothFileExchanger(mainCheckbox.checked);
};

async function setupBluetoothFileExchanger(receive) {
    if (fileExchanger) {
        fileExchanger.removeAllListeners();
        await fileExchanger.disable();
        removeDevices();
    }

    if (receive) {
        fileExchanger = new BluetoothFileExchangerCentral(
            SERVICE_UUID,
            CHARACTERISTIC_UUID,
            () => receiveDirectory
        );

        fileExchanger.on('discover', async (newDevice) => {
            if (devices.some((device) => device.id === newDevice.id)) return;

            newDevice = new Device(newDevice, fileExchanger);
            console.log('Discovered', newDevice);
            addDevice(newDevice);
        });

        fileExchanger.on('disconnect', (device) => {
            removeDevice(device);
        });

        elements.main.classList.replace('send', 'receive');
    } else {
        fileExchanger = new BluetoothFileExchangerPeripheral(
            SERVICE_UUID,
            CHARACTERISTIC_UUID,
            PERIPHERAL_NAME,
            () => dataFile
        );

        elements.main.classList.replace('receive', 'send');
    }

    fileExchanger.on('stateChange', (state) => {
        console.log('(transfer)', 'State: ' + state);
        elements.status.style.backgroundColor = statusStates[state];
        if (state === 'poweredOn') {
            // Run code for when bluetooth is turned on (from off)
        } else if (state === 'poweredOff') {
            removeDevices();
        }
    });
}

setupBluetoothFileExchanger(false);


function addDevice(device) {
    devices.push(device);

    const element = device.createElement();
    device.on('attemptReceive', () => {
        for (let device of devices) {
            device.elements.button.disabled = true;
        }
        device.elements.button.textContent = "Receiving...";
    });
    device.on('receive', (error) => {
        console.log('Data received - Device exit');
        if (error) {
            const errorMessage = 'Error receiving data from ' + device.name;
            alert(errorMessage);
            console.error(errorMessage, error);
            for (let device of devices) {
                if (!device.received) {
                    device.elements.button.textContent = 'Receive';
                    device.elements.button.disabled = false;
                }
            }
        } else {
            device.received = true;
            device.elements.button.textContent = 'Received';
            device.elements.device.classList.add('received');
            device.elements.button.disabled = true;
        }
    });

    elements.deviceList.appendChild(element);
}

function removeDevice(device) {
    devices.splice(devices.indexOf(device), 1);

    device.removeElement();
}

function removeDevices() {
    for (let i = devices.length - 1; i >= 0; i--) {
        removeDevice(devices[i]);
    }
}
