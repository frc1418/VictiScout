// Require filesystem API (used to save data to file later on)
const fs = require('fs');
// ipc is used to open and communicate with the data viewer and other additional windows.
var ipc = require('electron').ipcRenderer;

// Define prominent buttons.
var submit = document.getElementById('submit'),
	reset = document.getElementById('reset'),
    view = document.getElementById('view'),
	path = document.getElementById('path'),
	pathWarning = document.getElementById('path-warning');

// Get path to Desktop based on OS.
path.value = (process.platform == 'win32') ? process.env.USERPROFILE + '\\Desktop' : process.env.HOME + '/Desktop';

// Generate an array of all <input>s (plus <select>s) in document.
// These will be used to generate an object.
// Inputs named .special are exempt. These are used for things like path selection.
var tags = document.querySelectorAll('input:not(.special), select');
// Create empty object.
var inputs = {};
// Make each element be the value to a key named after its ID.
for (i = 0; i < tags.length; i++) inputs[tags[i].id] = tags[i];


// Submit data (also resets all fields).
submit.onclick = function() {
	// Make empty data object
	var data = {};
	// Go through each input in the data object and fill in the data from it
	for (var input in inputs) {
		// Input the values from each input into the data object.
        // Need to get different data depending on the type of the input.
        switch (inputs[input].type) {
            case 'checkbox':
                // Set this data point to a boolean of whether or not the checkbox is checked
                data[input] = inputs[input].checked;
                break;
            case 'number':
                // Make this data point be the parsed integer value of that input
                data[input] = parseInt(inputs[input].value);
                break;
            default:
                // Just use the raw string data
                data[input] = inputs[input].value;
                break;
        }
	}

	// Add timestamp to data.
	data['timestamp'] = new Date().getTime();

	// Log gathered data to console, useful for debug
	// console.log(data);

	// Append new JSON-parsed data to data.json file in designated location (usually Desktop).
	fs.appendFile(path.value + '/data.json', JSON.stringify(data) + '\n', function(err) {
		// If data cannot be placed in file in this location
		if (err) {
			// Show the INVALID DIRECTORY warning
			pathWarning.style.display = 'inline-block';
            // Focus cursor into directory
			path.focus();
		} else { // If data export goes ok
			// Hide INVALID DIRECTORY warning
			pathWarning.style.display = 'none';
			// Reset <input>s to prepare for new contents after submission
			resetInputs();
		}
	});
};

// When the value of the path input changes, check the path's validity just like above.
// This is the exact same thing as above, except without resetting values.
// TODO: Combine these.
path.onchange = function() {
	fs.access(path.value, function(err) {
		if (err) {
			pathWarning.style.display = 'inline-block';
			path.focus();
		} else {
            pathWarning.style.display = 'none';
		}
	});
};

// When reset button is clicked, trigger reset
reset.onclick = resetInputs();

// Reset all fields without submitting any data.
function resetInputs() {
	// For each input, reset to default value.
	for (var input in inputs) {
        // Reset to different values depending on what type of input it is
		if (inputs[input].type === 'number' && inputs[input].className !== 'large') { // If it's a small number box
			inputs[input].value = 0;
		} else if (inputs[input].className === 'large') { // If it's a big textbox (like team number)
			inputs[input].value = '';
		} else if (inputs[input].type === 'checkbox') { // Checkbox
			inputs[input].checked = false;
		} else if (inputs[input].tagName === 'SELECT') { // Selector
			inputs[input].value = 'No';
		}
	}
	console.log('Reset all inputs.');
}

// When 'View Data' button is clicked
view.onclick = function() {
    // Store the path to the data docuent
    localStorage.path = path.value;
    // Tell main.js to open rendered data window
    ipc.send('renderData');
};

// When user clicks on the screen, check if they clicked on an increase/decrease button
onclick = function(e) {
	// If click was on a decrease button > decrease the value of the adjacent input (but only if it's over 0)
	if (e.target.className === 'decrease' && e.target.nextElementSibling.value > 0) e.target.nextElementSibling.value = parseInt(e.target.nextElementSibling.value) - 1;
	// If click was on an increase button > increase the value of the adjacent input
	if (e.target.className === 'increase') e.target.previousElementSibling.value = parseInt(e.target.previousElementSibling.value) + 1;
};