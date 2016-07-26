// Require filesystem API (used to save data to file later on)
const fs = require('fs');

// Define buttons.
var submit = document.getElementById('submit'),
	clear = document.getElementById('clear');
/*,
increase = document.getElementsByClassName('increase'),
decrease = document.getElementsByClassName('decrease');*/

// Generate an array of all <input>s (plus <select>s) in document.
// These will be used to generate an object.
var tags = document.querySelectorAll('input, select');
// Create empty object.
var inputs = {};
// Make each element be the value to a key named after its ID.
for (i = 0; i < tags.length; i++) inputs[tags[i].id] = tags[i];


// Submit data (also clears all fields).
submit.onclick = function() {
	// Make empty data object
	var data = {};
	// Go through each input in the data object and fill in the data from it
	for (var input in inputs) {
		// Input the values from each input into the data object
		// Number values will be cast as integers.
		data[input] = (inputs[input].type === 'number') ? parseInt(inputs[input].value) : inputs[input].value;
		// Clear <input>s to prepare for new inputs after submission
		clearInputs();
	}

	// Add timestamp to data.
	data['timestamp'] = new Date().getTime();

	// Log gathered data to console, useful for debug
	// console.log(data);

	// Append new JSON-parsed data to data.json file on desktop.
	// (For Windows, to get the user home dir, you need to get process.env.USERPROFILE, for everything else process.env.HOME.)
	fs.appendFile(process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + '/Desktop/data.json', JSON.stringify(data));
};

clear.onclick = clearInputs();

// Clear all fields without submitting any data.
function clearInputs() {
	for (var input in inputs) inputs[input].value = (inputs[input].parentNode.className === 'defense') ? '0' : '';
	console.log('Cleared all inputs.');
}

/*
for (i = 0; i < increase.length; i++) {
    increase[i].onclick = add();
    decrease[i].onclick = subtract();
}

function add() {
    console.log(increase[i]);
    for (k = 0; k < this.parentNode.childNodes.length; k++) {
        if (this.parentNode.childNodes[k].tagName === 'INPUT') this.parentNode.childNodes[i].value += 1;
    }
}

function subtract() {
    for (i = 0; i < this.parentNode.childNodes.length; i++) {
        if (this.parentNode.childNodes[i].tagName === 'INPUT') this.parentNode.childNodes[i].value -= 1;
    }
}
*/