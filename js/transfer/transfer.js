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
        steps: {
            searching: document.getElementById('broadcast-steps').children[0],
            preparing: document.getElementById('broadcast-steps').children[1],
            sending: document.getElementById('broadcast-steps').children[2],
            sent: document.getElementById('broadcast-steps').children[3],
        }
    },
}

const dataFileInput = new FileInput(elements.dataFileContainer);
dataFileInput.on('change', (files) => {
    if (files.length > 0) {
        dataFile = files[0].path;
        // Start broadcasting once a file is selected
        setBroadcastStep(elements.broadcastSteps.steps.searching);
        if (fileExchanger.startAdvertising) {
            fileExchanger.startAdvertising();
        }
    } else {
        dataFile = undefined;
        setBroadcastStep(null);
        if (fileExchanger.stopAdvertising) {
            fileExchanger.stopAdvertising();
        }
    }
});
const receiveDirectoryInput = new FileInput(elements.receiveDirectoryContainer);
receiveDirectoryInput.on('change', (files) => {
    receiveDirectory = files.length > 0 ? files[0].name : localStorage.path;
});

const statusColors = {
    'poweredOff': 'rgb(209, 39, 39)',
    'poweredOn': 'rgb(51, 186, 34)',
};

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
            () => dataFile,
            dataFile !== undefined
        );

        fileExchanger.on('connect', (deviceAddress) => {
            setBroadcastStep(elements.broadcastSteps.steps.preparing);
        });

        fileExchanger.on('send', () => {
            setBroadcastStep(elements.broadcastSteps.steps.sending);
        });

        fileExchanger.on('sent', async () => {
            setBroadcastStep(elements.broadcastSteps.steps.sent);
            await sleep(5000);
            if (fileExchanger.stopAdvertising) {
                fileExchanger.stopAdvertising();
            }
        });

        elements.main.classList.replace('receive', 'send');
    }

    fileExchanger.on('stateChange', (state) => {
        console.log('(transfer)', 'State: ' + state);
        elements.status.style.backgroundColor = statusColors[state];
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
    for (let i = 0; i < devices.length; i++) {
        device.removeElement();
    }
    devices = [];
}

function setBroadcastStep(step) {
    const steps = elements.broadcastSteps.element.children;
    const stepNumber = Array.from(steps).indexOf(step);
    for (let i = 0; i < steps.length; i++) {
        const element = steps[i];
        
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
