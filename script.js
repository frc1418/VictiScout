// Require filesystem API (used to save data to file later on)
const fs = require('fs');

// Define prominent buttons.
var submit = document.getElementById('submit'),
	reset = document.getElementById('reset'),
    path = document.getElementById('path'),
    pathWarning = document.getElementById('path-warning');

function pathInit() {
    path.value = (process.platform == 'win32') ? process.env.USERPROFILE + '\\Desktop\\data.json' : process.env.HOME + '/Desktop/data.json';
}

pathInit();

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
		// Input the values from each input into the data object
		// Number values will be cast as integers.
		data[input] = (inputs[input].type === 'number') ? parseInt(inputs[input].value) : inputs[input].value;
	}

	// Add timestamp to data.
	data['timestamp'] = new Date().getTime();

	// Log gathered data to console, useful for debug
	// console.log(data);

	// Append new JSON-parsed data to data.json file in designated location (usually Desktop).
	fs.appendFile(path.value, JSON.stringify(data) + '\n', function(err) {
        if (err) {
            pathInit();
            pathWarning.innerHTML = 'NOT A VALID PATH!!!!';
            path.focus();
            throw err;
        } else {
            pathWarning.innerHTML = '';
            // Reset <input>s to prepare for new contents after submission
            resetInputs();
        }
    });
};

path.onblur = function() {
    pathWarning.innerHTML = 'Trying to submit w/ new path...';
    submit.click();
};

// When reset button is clicked, trigger reset
reset.onclick = resetInputs();

// Reset all fields without submitting any data.
function resetInputs() {
	// For each input, reset to default value.
	for (var input in inputs) {
		if (inputs[input].type === 'number' && inputs[input].className !== 'large') {
			inputs[input].value = 0;
		} else if (inputs[input].className === 'large') {
			inputs[input].value = '';
		} else if (inputs[input].type === 'checkbox') {
			inputs[input].checked = false;
		} else if (inputs[input].tagName === 'SELECT') {
            inputs[input].value = 'No';
        }
	}
	console.log('Reset all inputs.');
}

// When user clicks on the screen, check if they clicked on an increase/decrease button
onclick = function(e) {
	// If click was on a decrease button > increase the value of the adjacent input
	if (e.target.className === 'decrease' && e.target.nextElementSibling.value > 0) e.target.nextElementSibling.value = parseInt(e.target.nextElementSibling.value) - 1;
	// If click was on an increase button > decrease the value of the adjacent input
	if (e.target.className === 'increase') e.target.previousElementSibling.value = parseInt(e.target.previousElementSibling.value) + 1;
};