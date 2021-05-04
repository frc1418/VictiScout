const os = require('os');

function getBluetoothPreferencesURI() {
    if (os.type() === 'Windows_NT') {
        return 'ms-settings:bluetooth';
    } else if (os.type() === 'Darwin') {
        const majorVersion = parseInt(os.version().split('.')[0]);
        if (majorVersion <= 17) {
            // This doesn't actually work, I think it's disabled
            return 'x-apple.systempreferences:com.apple.preferences.Bluetooth';
        } else {
            return 'x-apple.systempreferences:com.apple.preferences.sharing?Services_BluetoothSharing';
        }
    }
    return '';
}

module.exports = {
    getBluetoothPreferencesURI
}
