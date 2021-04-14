const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const ipcMain = electron.ipcMain;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 750,
		height: 600,
		icon: __dirname + '../images/logo/logo.png',
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
	});

	// and load the index.html of the app.
	mainWindow.loadURL(`file://${__dirname}/../index.html`);

	// Emitted when the window is closed.
	mainWindow.on('closed', function() {
		// Dereference window object
		mainWindow = null;
	});
}

// Called when Electron has finished initialization.
app.on('ready', createWindow);

ipcMain.on('renderData', function(event, arg) {
	var dataWindow = new BrowserWindow({
		width: 1000,
		height: 500,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
	});
	// Load options page
	dataWindow.loadURL(`file://${__dirname}/../data.html`);

	dataWindow.on('closed', function() {
		// Dereference window object
		dataWindow = null;
	});
});

ipcMain.on('transferData', function(event, arg) {
	var transferWindow = new BrowserWindow({
		width: 1000,
		height: 500,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
	});
	// Load options page
	transferWindow.loadURL(`file://${__dirname}/../transfer.html`);

	transferWindow.on('closed', function() {
		// Dereference window object
		transferWindow = null;
	});
});