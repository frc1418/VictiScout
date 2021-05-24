const { EventEmitter } = require('events');
const { sleep } = require('./util.js');

const dataReceiptTimeOut = 10000;

class Device extends EventEmitter {
    received = false;

    constructor(device, fileExchanger) {
        super();
        this.device = device;
        this.fileExchanger = fileExchanger;
        this.id = device.id;
        this.name = device?.advertisement?.localName || device.id;
    }

    createElement() {
        const deviceElem = document.createElement('div');
        deviceElem.classList.add('device');
        deviceElem.textContent = this.name;

        const receiveButton = document.createElement('button');
        receiveButton.textContent = 'Receive';
        receiveButton.classList.add('receive-button');
        receiveButton.addEventListener('click', () => {
            // Make sure the data isn't already received and no other data is being received
            if (!this.received && !this.elements.button.disabled) {
                this.emit('attemptReceive');
                this.receiveData();
            }
        });
        deviceElem.appendChild(receiveButton);

        this.setupElements(deviceElem);
        return this.elements.device;
    }

    removeElement() {
        if (this.elements.device) {
            this.elements.device.remove();
            this.elements = {};
        }
    }

    setupElements(deviceElem) {
        this.elements = {
            device: deviceElem,
            button: deviceElem.querySelector('.receive-button'),
        }
    }

    async receiveData() {
        console.log('Receiving data from', this);
        try {
            await Promise.race([
                this.fileExchanger.receive(this.device),
                sleep(dataReceiptTimeOut).then(() => {
                    throw new Error('Data receipt timed out');
                })
            ]);
        } catch (error) {
            await this.device.disconnectAsync();
            this.emit('receive', error);
            return;
        }
        this.received = true;
        console.log('Data received and written');
        this.emit('receive');
    }
}

module.exports = {
    Device,
}
