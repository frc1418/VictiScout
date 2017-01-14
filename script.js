// Require filesystem API (used to save data to file later on)
const fs = require('fs');
// ipc is used to open and communicate with the data viewer and other additional windows.
const ipc = require('electron').ipcRenderer;
const unirest = require('unirest');
// Define prominent buttons.
var elements = {
    match: document.getElementById('match'),
    target: document.getElementById('target'),
    submit: document.getElementById('submit'),
    steam: document.getElementById('steam'),
	  reset: document.getElementById('reset'),
	  view: document.getElementById('view'),
    pathLabel: document.getElementById('path-label'),
	  path: document.getElementById('path'),
    autoAccuracy: document.getElementById('calculate-accuracy'),
    teleopAccuracy: document.getElementById('teleop-calculate-accuracy'),
    total: document.getElementById('calculate-total'),
	  pathWarning: document.getElementById('path-warning'),
    ropeAchieved: document.getElementById('rope-achieved'),
    ropeImage: document.getElementById('ropeImage')}
// Begin the data/ submit processing stuff
// Get path to Desktop based on OS.
elements.path.value = (process.platform == 'win32') ? process.env.USERPROFILE + '\\Desktop' : process.env.HOME + '/Desktop';
// Generate an array of all <input>s (plus <select>s) in document.
// These will be used to generate an object.
// Inputs named .special are exempt. These are used for things like path selection.
var tags = document.querySelectorAll('input:not(.special), select:not(.special)');
// Create empty object.
var inputs = {};
// Make each element be the value to a key named after its ID.
for (i = 0; i < tags.length; i++) inputs[tags[i].id] = tags[i];
// Submit data (also resets all fields).
elements.submit.onclick = function() {
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
		fs.appendFile(elements.path.value + '/data.json', JSON.stringify(data) + '\n', function(err) {
			// If data cannot be placed in file in this location
			if (err) {
				// Show the INVALID DIRECTORY warning
				elements.pathWarning.style.display = 'inline-block';
				// Focus cursor into directory
				elements.path.focus();
			} else { // If data export goes ok
				// Hide INVALID DIRECTORY warning
				elements.pathWarning.style.display = 'none';
				// Reset <input>s to prepare for new contents after submission
				resetInputs();
			}
		});
	} else {
        console.log(data);
        // Upload data to server via a POST request.
		unirest.post('http://' + elements.pathLabel.value + ':8080/api/data')
            .send(data)
			.end(function(response) {
				console.log(response.body);
			});
        // Reset <input>s to prepare for new contents after submission
        resetInputs();
	}
};
elements.target.onchange = function() {
    if (elements.target.value === 'Save data locally') {
        elements.pathLabel.innerHTML = 'Save location:';
        // TODO: Following line is a duplicate of the one at the top of the doc, fix
        elements.path.value = (process.platform == 'win32') ? process.env.USERPROFILE + '\\Desktop' : process.env.HOME + '/Desktop';
    } else {
        elements.pathLabel.innerHTML = 'Server IP:';
        elements.path.value = '192.168.1.1';
    }
};
// When the value of the path input changes, check the path's validity just like above.
// This is the exact same thing as above, except without resetting values.
// TODO: Combine these.
elements.path.onchange = function() {
    if (elements.target.value === 'Save data locally')
	fs.access(elements.path.value, function(err) {
		if (err) {
			elements.pathWarning.style.display = 'inline-block';
			elements.path.focus();
		} else {
			elements.pathWarning.style.display = 'none';
		}
	});
};
// When reset button is clicked, trigger reset
// TODO: call this function directly
elements.reset.onclick = function() { resetInputs(); }
// Reset all fields without submitting any data.
function resetInputs() {
  // Save the current match. It'll later be increased by one and reset.
  currentMatch = parseInt(elements.match.value);
  elements.ropeImage.src = 'img/ropeclimb.svg'
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
    // TODO: Only do this when 'submit' button is clicked?
    elements.match.value = currentMatch + 1;
	console.log('Reset all inputs.');
}
// When 'View Data' button is clicked
elements.view.onclick = function() {
	// Store the path to the data docuent
	localStorage.path = elements.path.value;
  localStorage.target = target.value;
	// Tell main.js to open rendered data window
	ipc.send('renderData');
};

// Begin the score processing stuff
// Function for determining accuracy in autonomous
elements.autoAccuracy.onclick = function() {
    var autoMisses = document.getElementById('auto-high-boiler-misses').value;
    var accuracy = document.getElementById('auto-high-boiler').value;
    var autoCombined = autoMisses + accuracy;
    if (autoCombined != 0) {
      var autoAccuracy = accuracy/autoCombined;
    } else {
      var autoAccuracy = 0;
    }
    autoAccuracy = Math.round(autoAccuracy * 100) + '%';
    document.getElementById('auto-accuracy').value = autoAccuracy;
}
// Function for determining accuracy in teleop
elements.teleopAccuracy.onclick = function() {
    var teleopMisses = document.getElementById('high-boiler-misses').value;
    var accuracy = document.getElementById('high-boiler').value;
    var teleopCombined = teleopMisses + accuracy;
    if (teleopCombined != 0) {
      var teleopAccuracy = accuracy/teleopCombined;
    } else {
      var teleopAccuracy = 0;
    }
    teleopAccuracy = Math.round(teleopAccuracy * 100) + '%';
    document.getElementById('teleop-accuracy').value = teleopAccuracy;
}
// Change the image color and the checkbox value
elements.ropeImage.onclick = function() {
    //If the image is red, make it white, if it is white, make it red
    if (elements.ropeImage.src.endsWith('img/ropeclimb.svg')) {
        elements.ropeAchieved.checked=true;
        elements.ropeImage.src = 'img/ropeclimb-red.svg';
    } else {
        elements.ropeAchieved.checked=false;
        elements.ropeImage.src = 'img/ropeclimb.svg';
    }
}
// Link the checkbox onchange function (called in the document) to the image onclick
ropeChanged = function() { elements.ropeImage.onclick(); };
var rotorCalc = function(autoGears, teleGears, playoffs) {
  // Get total gears
  gears = autoGears + teleGears;
  // Calculate number of rotors turning by the end of auto period and calculate points from them
  var autoRotors = (autoGears > 13) ? 4 : Math.round(Math.sqrt(autoGears));
  var autoPoints = 60*autoRotors;
  // Calculate rotors turning by the end of teleop;
  // then get rotors activated DURING teleop and get points
  var rotors = (gears > 13) ? 4 : Math.round(Math.sqrt(gears));
  var teleopRotors = rotors-autoRotors;
  var teleopPoints = 40*teleopRotors;
  // You get a bonus from turning all 4 rotors: 100 points in playoffs or 1 RP in quals
  var rotorsBonus = (playoffs&&rotors===4) ? 100 : 0;
  var rankingBonus = (!playoffs&&rotors===4) ? 1 : 0;
  // Tally up points
  var totalPoints = teleopPoints+autoPoints+rotorsBonus;
  // Return the values as an object
  return {points: {total: totalPoints, auto: autoPoints, teleop: teleopPoints}, rotors: {total: rotors, auto: autoRotors, teleop: teleopRotors}, rankingPoints: rankingBonus}
}
// Totals up all points for the whole thing
elements.total.onclick = function() {
    // Call accuracy functions
    elements.autoAccuracy.onclick();
    elements.teleopAccuracy.onclick();
    // Call steam function
    var steamPoints = elements.steam.onclick();
    // Get gear values for auto and teleop
    var teleGears = document.getElementById('gear').value;
    var autoGears = document.getElementById('auto-gear-count').value;
    // The score depends on the game stage: in the playoffs, no ranking points are scored;
    // In the qualifiers, only ranking points are scored (the match points still matter
    // as wins/ties win ranking points)
    var playoffs = document.getElementById('playoffs').checked;
    // You get a ranking point from scoring 40kPa in auto, but in playoffs you get 20 points
    var steamBonus = (steamPoints>40&&playoffs) ? 20 : 0;
    // Call the rotorCalc function to calculate points (and ranking points) from gears
    var rotorInfo = rotorCalc(autoGears, teleGears, playoffs);
    // We only need the points right now
    var rotorPoints = rotorInfo.points.total;
    // Check if the rope was climbed
    var ropeClimbed = elements.ropeAchieved.checked;
    // Calculate points from the rope climb
    var ropePoints = (ropeClimbed) ? 50 : 0;
    // Tally up all the points
    var totalPoints = steamPoints + rotorPoints + ropePoints + steamBonus;
    // Get ranking point values from the rotors and steam bonuses
    var rankingPoints = rotorInfo.rankingPoints + ((steamPoints>40&&!playoffs) ? 1 : 0);
    // Display the values for ranking points and total points
    document.getElementById('ranking-points').value = rankingPoints;
    document.getElementById('total-points').value = totalPoints;
}
// Calculate the steam produced (equivalent to 1 match point)
elements.steam.onclick = function() {
  // Get values of boiler scores
  var autoLowBoiler = document.getElementById('auto-low-boiler').value;
  var autoHighBoiler = document.getElementById('auto-high-boiler').value;
  var highBoiler = document.getElementById('high-boiler').value;
  var lowBoiler = document.getElementById('low-boiler').value;
  // The number of steam points
  var steamNum = 0;
  // Point values for the gears
  var pointKeys = {auto: {highBoiler: 1, lowBoiler: 3}, teleop: {highBoiler: 3, lowBoiler: 9}};
  // Increment steamNum based on point values
  steamNum += (lowBoiler-(lowBoiler%pointKeys.teleop.lowBoiler))/pointKeys.teleop.lowBoiler;
  steamNum += (highBoiler-(highBoiler%pointKeys.teleop.highBoiler))/pointKeys.teleop.highBoiler;
  steamNum += (autoLowBoiler-(autoLowBoiler%pointKeys.auto.lowBoiler))/pointKeys.auto.lowBoiler;
  steamNum += (autoHighBoiler-(autoHighBoiler%pointKeys.auto.highBoiler))/pointKeys.auto.highBoiler;
  // Display the value in the steam output element (with kPa appended)
  steamNumText = steamNum + ' kPa';
  document.getElementById('steam-counter').value = steamNumText;
  // We can reuse this function for calculating totals
  return steamNum;
}
// When user clicks on the screen, check if they clicked on an increase/decrease button
onclick = function(e) {
	// If click was on a decrease button > decrease the value of the adjacent input (but only if it's over 0)
	if (e.target.className === 'decrease' && e.target.nextElementSibling.value > 0) e.target.nextElementSibling.value = parseInt(e.target.nextElementSibling.value) - 1;
	// If click was on an increase button > increase the value of the adjacent input
	if (e.target.className === 'increase') e.target.previousElementSibling.value = parseInt(e.target.previousElementSibling.value) + 1;
};
