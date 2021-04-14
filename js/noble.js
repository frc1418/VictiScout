const noble = require('@abandonware/noble');

const ECHO_SERVICE_UUID = 'ec00';
const ECHO_CHARACTERISTIC_UUID = 'ec0e';

function sleep(millis) {
    return new Promise((resolve) => setTimeout(resolve, millis));
}

noble.on('stateChange', async (state) => {
  if (state === 'poweredOn') {
    const started = performance.now();

    await sleep(5000);
    console.log('Scanning');
    await noble.startScanningAsync([ECHO_SERVICE_UUID], false);
  } else {
    await noble.stopScanningAsync();
  }
});

noble.on('discover', async (peripheral) => {
    // connect to the first peripheral that is scanned
    await noble.stopScanningAsync();
    const name = peripheral.advertisement.localName;
    console.log(`Connecting to '${name}' ${peripheral.id}`);
    connectAndSetUp(peripheral);
});

function connectAndSetUp(peripheral) {

  peripheral.connect(error => {
    console.log('Connected to', peripheral.id);

    // specify the services and characteristics to discover
    const serviceUUIDs = [ECHO_SERVICE_UUID];
    const characteristicUUIDs = [ECHO_CHARACTERISTIC_UUID];

    peripheral.discoverSomeServicesAndCharacteristics(
        serviceUUIDs,
        characteristicUUIDs,
        onServicesAndCharacteristicsDiscovered
    );
  });
  
  peripheral.on('disconnect', () => console.log('disconnected'));
}

function onServicesAndCharacteristicsDiscovered(error, services, characteristics) {
  console.log('Discovered services and characteristics');
  const echoCharacteristic = characteristics[0];

  // data callback receives notifications
  echoCharacteristic.on('data', (data, isNotification) => {
    console.log('Received: "' + data + '"');
  });
  
  // subscribe to be notified whenever the peripheral update the characteristic
  echoCharacteristic.subscribe(error => {
    if (error) {
      console.error('Error subscribing to echoCharacteristic');
    } else {
      console.log('Subscribed for echoCharacteristic notifications');
    }
  });

  // create an interval to send data to the service
  let count = 0;
  setInterval(() => {
    count++;
    const message = new Buffer.from('hello, ble ' + count, 'utf-8');
    console.log("Sending:  '" + message + "'");
    echoCharacteristic.write(message);
  }, 2500);
}