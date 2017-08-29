// Require filesystem API (used to save data to file later on)
const fs = require('fs');
// ipc is used to open and communicate with the data viewer and other additional windows.
const ipc = require('electron').ipcRenderer;
const user = require('os').userInfo();
// Define some elements.
var pg = {
    team: document.getElementById('team'),
    match: document.getElementById('match'),
    submit: document.getElementById('submit'),
    reset: document.getElementById('reset'),
    view: document.getElementById('view'),
}

// Get date for file naming.
var d = new Date();
var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
var path = home + (fs.existsSync(home + '/Desktop') ? '/Desktop' : '') + '/scoutdata_' + user.username + '_' + ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'][d.getMonth()] + '_' + d.getDate() + '_' + d.getFullYear() + '.json';

// Generate an array of all data inputs in document.
// These will be used to generate an object.
// Inputs named .special are exempt. These can be used for things like path selection.
var tags = document.querySelectorAll('input:not(.special), select:not(.special), textarea');
// Create empty object.
var inputs = {};
// Make each element be the value to a key named after its ID.
for (t in tags) inputs[tags[t].id] = tags[t];

// Submit match data.
pg.submit.onclick = function() {
    if (
        // If the user has entered a team number and match number
        pg.team.value &&
        pg.match.value
    ) {
        // Make empty match object
        var match = {};
        // Go through each input in the data object and fill in the data from it
        for (input in inputs) {
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
        window.alert('You must enter a team number and match!');
    }
    pg.match.value = currentMatch + 1;
};

function write(match) {
    var data = (fs.existsSync(path) && fs.statSync(path).size > 0) ? JSON.parse(fs.readFileSync(path)) : [];
    data.push(match);
    // Write data to file.
    // Very occasionally, this will return JSON that uses WYSIWYG-style quotes (“”), rather
    // than JSON-standard, side-ambiguous, utf-8 quotes (""). This breaks JSON parsing later on.
    // Since it's as yet unclear why that issue occurs, just replace via regex for now.
    fs.writeFileSync(path, JSON.stringify(data).replace(/[“”]/, '"'));
}

// Reset all fields.
function resetInputs() {
    // Save the current match. It'll later be increased by one and reset.
    // TODO: This triggers a warning if the input is empty.
    currentMatch = parseInt(pg.match.value);
    // For each input, reset to default value.
    for (input in inputs) {
        // Reset to different values depending on what type of input it is
        if (inputs[input].type === 'number' && inputs[input].className !== 'large') inputs[input].value = 0; // If it's a small number box
        else if (inputs[input].type === 'checkbox') inputs[input].checked = false; // Checkbox
        else if (inputs[input].tagName === 'SELECT') inputs[input].value = 'No'; // Selector
        else inputs[input].value = '';
    }
    console.log('Reset inputs.');
}

// When reset button is clicked, trigger reset
pg.reset.onclick = function() {
    if (window.confirm('Really reset inputs?')) resetInputs();
};

// When 'View Data' button is clicked
pg.view.onclick = function() {
    // Store the path to the data document
    localStorage.path = path;
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
