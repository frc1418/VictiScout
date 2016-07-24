// Require filesystem API (used to save data to file later on)
const fs = require('fs');

// Define buttons.
var submit = document.getElementById('submit'),
	reset = document.getElementById('reset');

// Generate an array of all <input>s in document.
// These will be used to generate an object.
var tags = document.getElementsByTagName('input');
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
		// Input the values from each <input> into the data object
		// Number values will be cast as integers.
		data[input] = (inputs[input].type === 'number') ? parseInt(inputs[input].value) : inputs[input].value;
		// Clear <input>s to prepare for new inputs after submission
		inputs[input].value = '';
	}

	// Add timestamp to data.
	data['timestamp'] = new Date().getTime();

    // Log gathered data to console, useful for debug
	console.log(data);

	// Append new data to data.json file
	fs.appendFile('data.json', JSON.stringify(data), function(err) {
		if (err) throw err;
		console.log('Data appended');
	});
};

// Clear all fields without submitting any data.
reset.onclick = function() {
	for (var input in inputs) inputs[input].value = '';
	console.log('Reset all inputs.');
};