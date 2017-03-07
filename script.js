// Require filesystem API (used to save data to file later on)
const fs = require('fs');
// ipc is used to open and communicate with the data viewer and other additional windows.
const ipc = require('electron').ipcRenderer;
// Define some elements.
var pg = {
    match: document.getElementById('match'),
    submit: document.getElementById('submit'),
    reset: document.getElementById('reset'),
    view: document.getElementById('view'),
    pathLabel: document.getElementById('path-label'),
    path: document.getElementById('path'),
    pathWarning: document.getElementById('path-warning')
}

// Begin the data/ submit processing stuff
// Get path to Desktop based on OS.
pg.path.value = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];

// Generate an array of all <input>s (plus <select>s) in document.
// These will be used to generate an object.
// Inputs named .special are exempt. These are used for things like path selection.
var tags = document.querySelectorAll('input:not(.special), select:not(.special), textarea');
// Create empty object.
var inputs = {};
// Make each element be the value to a key named after its ID.
for (i = 0; i < tags.length; i++) inputs[tags[i].id] = tags[i];
// Submit data (also resets all fields).
pg.submit.onclick = function() {
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
    // data['timestamp'] = new Date().getTime();

    // Log gathered data to console, useful for debug
    // console.log(data);

    // Append new JSON-parsed data to data.json file in designated location (usually Desktop).
    fs.appendFile(pg.path.value + '/data.json', JSON.stringify(data) + '\n', function(err) {
        // If data cannot be placed in file in this location
        if (err) {
            // Show the INVALID DIRECTORY warning
            pg.pathWarning.style.display = 'inline-block';
            // Focus cursor into directory
            pg.path.focus();
        } else { // If data export goes ok
            // Hide INVALID DIRECTORY warning
            pg.pathWarning.style.display = 'none';
            // Reset <input>s to prepare for new contents after submission
            resetInputs();
        }
    });
};
// When the value of the path input changes, check the path's validity just like above.
// This is the exact same thing as above, except without resetting values.
// TODO: Combine these.
pg.path.onchange = function() {
    if (pg.target.value === 'Save data locally')
        fs.access(pg.path.value, function(err) {
            if (err) {
                pg.pathWarning.style.display = 'inline-block';
                pg.path.focus();
            } else {
                pg.pathWarning.style.display = 'none';
            }
        });
};
// When reset button is clicked, trigger reset
// TODO: call this function directly
pg.reset.onclick = function() {
    resetInputs();
}
// Reset all fields without submitting any data.
function resetInputs() {
    // Save the current match. It'll later be increased by one and reset.
    // TODO: This triggers a warning if the input is empty.
    currentMatch = parseInt(pg.match.value);
    // For each input, reset to default value.
    for (var input in inputs) {
        // Reset to different values depending on what type of input it is
        if (inputs[input].type === 'number' && inputs[input].className !== 'large') inputs[input].value = 0; // If it's a small number box
        else if (inputs[input].className === 'large') inputs[input].value = ''; // If it's a big textbox (like team number)
        else if (inputs[input].type === 'checkbox') inputs[input].checked = false; // Checkbox
        else if (inputs[input].tagName === 'SELECT') inputs[input].value = 'No'; // Selector
    }
    // Reset match field to be one greater than it was previously.
    // TODO: Only do this when 'submit' button is clicked?
    pg.match.value = currentMatch + 1;
    console.log('Reset all inputs.');
}
// When 'View Data' button is clicked
pg.view.onclick = function() {
    // Store the path to the data docuent
    localStorage.path = pg.path.value;
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
