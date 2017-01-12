// Require filesystem API (used to save data to file later on)
const fs = require('fs');
// ipc is used to open and communicate with the data viewer and other additional windows.
const ipc = require('electron').ipcRenderer;
const unirest = require('unirest');

// Define prominent buttons.
var match = document.getElementById('match'),
    target = document.getElementById('target'),
    submit = document.getElementById('submit'),
    steam = document.getElementById('steam'),
	reset = document.getElementById('reset'),
	view = document.getElementById('view'),
    pathLabel = document.getElementById('path-label'),
	path = document.getElementById('path'),
  accuracy = document.getElementById('calculate-accuracy'),
	pathWarning = document.getElementById('path-warning');

// Get path to Desktop based on OS.
path.value = (process.platform == 'win32') ? process.env.USERPROFILE + '\\Desktop' : process.env.HOME + '/Desktop';

// Generate an array of all <input>s (plus <select>s) in document.
// These will be used to generate an object.
// Inputs named .special are exempt. These are used for things like path selection.
var tags = document.querySelectorAll('input:not(.special), select:not(.special)');
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

	// TODO: Define this at the top
	if (target.value === 'Save data locally') {
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
	} else {
        console.log(data);
        // Upload data to server via a POST request.
		unirest.post('http://' + pathLabel.value + ':8080/api/data')
            .send(data)
			.end(function(response) {
				console.log(response.body);
			});
        // Reset <input>s to prepare for new contents after submission
        resetInputs();
	}
};

target.onchange = function() {
    if (target.value === 'Save data locally') {
        pathLabel.innerHTML = 'Save location:';
        // TODO: Following line is a duplicate of the one at the top of the doc, fix
        path.value = (process.platform == 'win32') ? process.env.USERPROFILE + '\\Desktop' : process.env.HOME + '/Desktop';
    } else {
        pathLabel.innerHTML = 'Server IP:';
        path.value = '192.168.1.1';
    }
};

// When the value of the path input changes, check the path's validity just like above.
// This is the exact same thing as above, except without resetting values.
// TODO: Combine these.
path.onchange = function() {
    if (target.value === 'Save data locally')
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
    // Save the current match. It'll later be increased by one and reset.
    currentMatch = parseInt(match.value);
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
    // Reset match field to be one greater than it was previously.
    // TODO: Only do this when "submit" button is clicked?
    match.value = currentMatch + 1;
	console.log('Reset all inputs.');
}

// When 'View Data' button is clicked
view.onclick = function() {
	// Store the path to the data docuent
	localStorage.path = path.value;
    localStorage.target = target.value;
	// Tell main.js to open rendered data window
	ipc.send('renderData');
};
// Calculate the amount of steam produced this round
accuracy.onclick = function() {
    var autoMisses = parseInt(document.getElementById('auto-high-boiler-misses').value);
    var accuracy = parseInt(document.getElementById('auto-high-boiler').value);
    var autoCombined = autoMisses + accuracy;
    var autoAccuracy = accuracy/autoCombined;
    autoAccuracy = autoAccuracy * 100 + "%";
    document.getElementById('auto-accuracy').value = autoAccuracy;
}
steam.onclick = function() {
  // Create a variable containg the number of ato low boiler balls
  var autoLowBoiler = parseInt(document.getElementById('auto-low-boiler').value);
  // Create a variable containing the number of auto high boiler balls
  var autoHighBoiler = parseInt(document.getElementById('auto-high-boiler').value);
  // Create a variable containing the number of teleop high boiler balls
  var highBoiler = parseInt(document.getElementById('high-boiler').value);
  // Create a variable for teleop low goals
  var lowBoiler = parseInt(document.getElementById('low-boiler').value);
  // Create a variable for amount of steam and set it to zero for starting
  var SteamNum = 0;
  // Calculate steam produced by the low boiler during auto and the high boiler during teleop
  // 3 Balls = 1 Steam
  // Combine autoLowBoiler and highBoiler
  var threeToOne = parseInt(autoLowBoiler + highBoiler);
  if (threeToOne <= 2) {
      // Do nothing
  } else if (threeToOne === 3) {
    SteamNum++;
  } else if (threeToOne > 3) {
      // If the threeToOne has more than 3 balls go in during auto, remove three balls and add a point to the Steam
      // Repeat until there are < 3 balls
    while (threeToOne >= 3) {
      threeToOne -= 3;
      SteamNum++;
    }
  }
  // Calculate steam produced in high boiler during auto
  // 1 Ball = 1 Steam
  if (autoHighBoiler > 0) {
      while (autoHighBoiler >= 1) {
          SteamNum++;
          autoHighBoiler -= 1;
      }
  }
  // Calculate steam produced in teleop High Goal
  // 9 Balls = 1 SteamNum
  if (lowBoiler <= 8) {
      // Do nothing
  } else if (lowBoiler === 9) {
    SteamNum++;
} else if (lowBoiler > 9) {
    while (lowBoiler >= 9) {
      lowBoiler -= 3;
      SteamNum++;
    }
  }
  // Put amount of steam back into the 'SteamCounter' slot on VictiScout
  // After adding kPa
  SteamNum = SteamNum + " kPa";
  document.getElementById('steam-counter').value = SteamNum;
}

// When user clicks on the screen, check if they clicked on an increase/decrease button
onclick = function(e) {
	// If click was on a decrease button > decrease the value of the adjacent input (but only if it's over 0)
	if (e.target.className === 'decrease' && e.target.nextElementSibling.value > 0) e.target.nextElementSibling.value = parseInt(e.target.nextElementSibling.value) - 1;
	// If click was on an increase button > increase the value of the adjacent input
	if (e.target.className === 'increase') e.target.previousElementSibling.value = parseInt(e.target.previousElementSibling.value) + 1;
};
