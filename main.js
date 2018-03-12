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
		width: 870,
		height: 475,
		icon: __dirname + '/logo.png'
	});

	// and load the index.html of the app.
	mainWindow.loadURL(`file://${__dirname}/index.html`);

    // Uncomment to open dev tools (Inspect Element) automatically
	// mainWindow.webContents.openDevTools();

	// Emitted when the window is closed.
	mainWindow.on('closed', function() {
		// Dereference window object
		mainWindow = null;
	});
}

// Called when Electron has finished initialization.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function() {
	// On OS X, stay active until the user quits explicitly
	if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function() {
	// On OS X, re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) createWindow();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.on('renderData', function(event, arg) {
	var dataWindow = new BrowserWindow({
		width: 1000,
		height: 500
	});
	// Load options page
	dataWindow.loadURL(`file://${__dirname}/data.html`);

	dataWindow.on('closed', function() {
		// Dereference window object
		dataWindow = null;
	});
});
