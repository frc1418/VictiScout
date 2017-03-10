// Require filesystem API (used to save data to file later on)
const fs = require('fs');
// ipc is used to open and communicate with the data viewer and other additional windows.
const ipc = require('electron').ipcRenderer;
// Define some elements.
var pg = {
    team: document.getElementById('team'),
    match: document.getElementById('match'),
    submit: document.getElementById('submit'),
    reset: document.getElementById('reset'),
    view: document.getElementById('view'),
    pathLabel: document.getElementById('path-label'),
    path: document.getElementById('path'),
    pathWarning: document.getElementById('path-warning')
}

// Get path to Desktop (different on Windows).
pg.path.value = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + '/Desktop/data.json';

// Generate an array of all <input>s (plus <select>s) in document.
// These will be used to generate an object.
// Inputs named .special are exempt. These are used for things like path selection.
var tags = document.querySelectorAll('input:not(.special), select:not(.special), textarea');
// Create empty object.
var inputs = {};
// Make each element be the value to a key named after its ID.
for (i = 0; i < tags.length; i++) inputs[tags[i].id] = tags[i];


// Submit match data.
pg.submit.onclick = function() {
    if (
        // If the user has entered a team number
        pg.team.value
    ) {
        // Make empty match object
        var match = {};
        // Go through each input in the data object and fill in the data from it
        for (var input in inputs) {
            // Input the values from each input into the data object.
            // Need to get different data depending on the type of the input.
            switch (inputs[input].type) {
                case 'checkbox':
                    // Set this data point to a boolean of whether or not the checkbox is checked
                    match[input] = inputs[input].checked;
                    break;
                case 'number':
                    // Make this data point be the parsed integer value of that input
                    match[input] = parseInt(inputs[input].value);
                    break;
                default:
                    // Just use the raw string data
                    match[input] = inputs[input].value;
                    break;
            }
        }

        write(match);
        resetInputs();
    } else {
        // TODO: More professional warning!
        window.alert('Please enter a team number!');
    }
};

function write(match) {
    // TODO: Getting size could function as a means of checking its existence in theory,
    // but for now an error occurs when you get stats of a nonexistent file.
    var data = (fs.existsSync(pg.path.value) && fs.statSync(pg.path.value).size > 0) ? JSON.parse(fs.readFileSync(pg.path.value)) : [];
    data.push(match);
    fs.writeFileSync(pg.path.value, JSON.stringify(data));
}

// Reset all fields.
function resetInputs() {
    // Save the current match. It'll later be increased by one and reset.
    // TODO: This triggers a warning if the input is empty.
    currentMatch = parseInt(pg.match.value);
    // For each input, reset to default value.
    for (var input in inputs) {
        // Reset to different values depending on what type of input it is
        if (inputs[input].type === 'number' && inputs[input].className !== 'large') inputs[input].value = 0; // If it's a small number box
        else if (inputs[input].type === 'checkbox') inputs[input].checked = false; // Checkbox
        else if (inputs[input].tagName === 'SELECT') inputs[input].value = 'No'; // Selector
        else inputs[input].value = '';
    }
    // Reset match field to be one greater than it was previously.
    // TODO: Only do this when 'submit' button is clicked?
    pg.match.value = currentMatch + 1;
    console.log('Reset inputs.');
}

// When reset button is clicked, trigger reset
// TODO: call this function directly
pg.reset.onclick = function() {
    if (window.confirm('Really reset inputs?')) resetInputs();
}

// When 'View Data' button is clicked
pg.view.onclick = function() {
    // Store the path to the data document
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
