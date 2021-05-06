const { BluetoothFileExchangerCentral, BluetoothFileExchangerPeripheral } = require('./js/transfer/bluetooth.js');
const { Device } = require('./js/transfer/device.js');
const { FileInput } = require('./js/fileInput.js');
const os = require('os');
const { shell } = require('electron');
const { getBluetoothPreferencesURI } = require('./js/transfer/bluetoothPreferences.js');

const SERVICE_UUID = 'ec00';
const CHARACTERISTIC_UUID = 'ec0e';
const PERIPHERAL_NAME = 'VictiScout-' + os.userInfo().username;
// Set both of these from UI
let receiveDirectory = localStorage.desktopPath;
let dataFile = undefined;

let fileExchanger;
let devices = [];

const elements = {
    main: document.getElementsByTagName('main')[0],
    status: document.getElementById('status-indicator'),
    deviceList: document.getElementById('device-list'),
    receiveDirectoryContainer: document.getElementById('receive-directory-container'),
    dataFileContainer: document.getElementById('data-file-container'),
    enableBluetooth: document.getElementById('enable-bluetooth'),
    broadcastSteps: {
        element: document.getElementById('broadcast-steps'),
        steps: [
            document.getElementById('broadcast-steps').children[0],
            document.getElementById('broadcast-steps').children[1],
            document.getElementById('broadcast-steps').children[2],
            document.getElementById('broadcast-steps').children[3]
        ]
    }
}

const dataFileInput = new FileInput(elements.dataFileContainer);
dataFileInput.on('change', (files) => {
    if (files.length > 0) {
        dataFile = files[0].path;
    } else {
        dataFile = undefined;
    }
});
const receiveDirectoryInput = new FileInput(elements.receiveDirectoryContainer);
receiveDirectoryInput.on('change', (files) => {
    console.log(files[0]);
    if (files.length > 0) {
        receiveDirectory = files[0].path;
    } else {
        receiveDirectory = localStorage.path;
    }
});

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

        advanceToBroadcastStep(0);

        fileExchanger.on('connect', (deviceAddress) => {
            advanceToBroadcastStep(1);
        });

        fileExchanger.on('send', () => {
            advanceToBroadcastStep(2);
        });

        fileExchanger.on('sent', () => {
            advanceToBroadcastStep(3);
        });

        elements.main.classList.replace('receive', 'send');
    }

    fileExchanger.on('stateChange', (state) => {
        console.log('(transfer)', 'State: ' + state);
        elements.status.style.backgroundColor = statusStates[state];
        if (state === 'poweredOn') {
            // Run code for when bluetooth is turned on (from off)
            elements.main.classList.add('connected');
        } else if (state === 'poweredOff') {
            removeDevices();
            elements.main.classList.remove('connected');
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

function advanceToBroadcastStep(stepNumber) {
    for (let i = 0; i < elements.broadcastSteps.steps.length; i++) {
        const element = elements.broadcastSteps.steps[i];
        
        if (i < stepNumber) {
            element.classList.remove('current');
            element.classList.add('complete');
        } else if (i > stepNumber) {
            element.classList.remove('complete', 'current');
        } else {
            element.classList.add('current');
        }
    }
}

elements.enableBluetooth.addEventListener('click', () => {
    shell.openExternal(getBluetoothPreferencesURI());
});