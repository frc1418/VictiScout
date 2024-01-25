const remote = require('electron').remote;
const ipc = require('electron').ipcRenderer;
const fs = require('fs');
const { EOL } = require('os');


// Define <thead>, <tbody>, warning, and match deletion vars to be filled later on.
var thead = document.getElementsByTagName('thead')[0],
    tbody = document.getElementsByTagName('tbody')[0],
    warning = document.getElementById('warning'),
    processingSection = document.getElementById('processing'),
    fileInputButton = document.getElementById('input-file'),
    fileInputList = document.getElementsByClassName('input-list')[0],
    deleteButton = document.getElementById('delete-button'),
    outputFileName = document.getElementById('output-file'),
    transferButton = document.getElementById('transfer-button');
    

const acceptableFileTypes = ['application/json', '.json', 'text/csv', '.csv'];
var fileBuffer = [];

if (fs.existsSync(localStorage.path) && fs.statSync(localStorage.path).size > 0) {
    render(JSON.parse(fs.readFileSync(localStorage.path)));
} else {
    // Display "no data" warning if no data is found
    warning.style.display = 'flex';
    processingSection.style.display = 'none';
    deleteButton.style.display = 'none';
}


function sortDataByAccuracy() {
    // Get all rows in the tbody
    const rows = Array.from(tbody.getElementsByTagName('tr'));

    // Get the index of the Teleop Accuracy column
    const accuracyIndex = Array.from(thead.getElementsByTagName('th')).findIndex(th => th.textContent.toLowerCase() === 'teleop accuracy');
    // Sort rows based on Teleop Accuracy values
    rows.sort((a, b) => {
        const accuracyA = parseFloat(a.cells[accuracyIndex].textContent) || 0;
        const accuracyB = parseFloat(b.cells[accuracyIndex].textContent) || 0;
        return accuracyB - accuracyA; // Sort in descending order
    });

    // Remove existing rows from the tbody
    rows.forEach(row => tbody.removeChild(row));

    // Append sorted rows to the tbody
    rows.forEach(row => tbody.appendChild(row));
}
document.getElementById('teleop-sort-button').addEventListener('click', function () {
    sortDataByAccuracy();
});
function sortDataByAutoAccuracy() {
    // Get all rows in the tbody
    const rows = Array.from(tbody.getElementsByTagName('tr'));

    // Get the index of the Auto Accuracy column
    const accuracyIndex = Array.from(thead.getElementsByTagName('th')).findIndex(th => th.textContent.toLowerCase() === 'auto accuracy');
    
    // Sort rows based on Auto Accuracy values
    rows.sort((a, b) => {
        const accuracyA = parseFloat(a.cells[accuracyIndex].textContent) || 0;
        const accuracyB = parseFloat(b.cells[accuracyIndex].textContent) || 0;
        return accuracyB - accuracyA; // Sort in descending order
    });

    // Remove existing rows from the tbody
    rows.forEach(row => tbody.removeChild(row));

    // Append sorted rows to the tbody
    rows.forEach(row => tbody.appendChild(row));
}

// Add event listener for the button triggering the sort
document.getElementById('auto-sort-button').addEventListener('click', function () {
    sortDataByAutoAccuracy();
});

function render(data) {
    // Make column headers.
    // Create <tr> element to put everything in.
    var tr = document.createElement('tr');

    // Collect all unique properties from all data objects
    var allProperties = new Set();
    for (var pt in data) {
        for (var prop in data[pt]) {
            allProperties.add(prop);
        }
    }

    // Log all property names
    console.log('All Properties:', Array.from(allProperties));

    // Iterate over all properties and create headers
    allProperties.forEach(function (prop) {
        var th = document.createElement('th');
        th.textContent = pname(prop);
        tr.appendChild(th);
    });

    // Added new headers for Height and Chassis Size, wouldn't reccomend adding anymore headers in this array
    var newHeaders = ['Height', 'Chassis Size', 'Teleop Accuracy', 'Auto Accuracy'];
    newHeaders.forEach(function (header) {
        var th = document.createElement('th');
        th.textContent = header;
        tr.appendChild(th);
    });
    // Put the row into the table header
    thead.appendChild(tr);
    // For each object in the data array,
    for (var pt in data) {
        // Make a new table row
        tr = document.createElement('tr');
        var check = document.createElement('input');
        // Iterate over all properties
        allProperties.forEach(function (prop) {
            // Make a table cell for each
            var td = document.createElement('td');
            // Fill table cell with that data property
            td.textContent = data[pt][prop] || ''; // Use default value if property is undefined
            // Put the cell into the row
            tr.appendChild(td);
        });
        // Add new input fields for Height and Chassis Size
        ['height', 'chassis-size'].forEach(function (prop) {
            var td = document.createElement('td');
            var input = document.createElement('input');
            input.type = 'text';
            input.placeholder = pname(prop);
            // Retrieve stored value from localStorage
            var storedValue = localStorage.getItem(`${prop}-${data[pt].team}`);
            input.value = storedValue || data[pt][prop] || '';
            // Save value to localStorage when input changes
            input.addEventListener('input', function () {
                localStorage.setItem(`${prop}-${data[pt].team}`, input.value);
            });
            td.appendChild(input);
            tr.appendChild(td);
        });
        // Calculate Teleop Accuracy and add a new cell for it
        var teleopAccuracyCell = document.createElement('td');
        var teleopNotesShot = parseInt(data[pt]['teleop-notes-shot']) || 0;
        var teleopNotesMade = parseInt(data[pt]['teleop-notes-made']) || 0;
        var teleopAccuracy = teleopNotesShot > 0 ? (teleopNotesMade / teleopNotesShot * 100).toFixed(2) + '%' : 'N/A';
        teleopAccuracyCell.textContent = teleopAccuracy;
        // Append the Teleop Accuracy cell to the row
        tr.appendChild(teleopAccuracyCell);
        // Calculate Auto Accuracy and add a new cell for it
        var autoAccuracyCell = document.createElement('td');
        var autoNotesShot = parseInt(data[pt]['auto-notes-shot']) || 0;
        var autoNotesMade = parseInt(data[pt]['auto-notes-made']) || 0;
        var autoAccuracy = autoNotesShot > 0 ? (autoNotesMade / autoNotesShot * 100).toFixed(2) + '%' : 'N/A';
        autoAccuracyCell.textContent = autoAccuracy;
        // Append the Auto Accuracy cell to the row
        tr.appendChild(autoAccuracyCell);

        // Put this row into the document
        tbody.appendChild(tr);
        check.className = 'generated';
        tr.appendChild(check);
    }
    console.log('Entire Data Array:', data);
}
var inputs = document.querySelectorAll('input.generated');
for (elem of inputs) {
    elem.setAttribute('type', 'checkbox');
}
transferButton.onclick = function () {
    ipc.send('transferData');
}
deleteButton.onclick = function () {
    console.log('Delete button clicked');
    var array = JSON.parse(fs.readFileSync(localStorage.path));
    console.log('Array before deletion:', array);
    for (box of inputs) {
        if (box.checked) {
            var matchNum = 0;
            matchNum = (parseInt(box.parentNode.childNodes[1].textContent));
            for (index in array) {
                if (array[index].match === matchNum) {
                    array.splice(index, 1);
                }
            }
        }
    }
    if (array.length == 0) {
        fs.writeFileSync(localStorage.path, "");
    } else {
        fs.writeFileSync(localStorage.path, JSON.stringify(array).replace(/[""]/, '"'));
    }
    location.reload();
}

function pname(str) {
    var words = str.split('-');
    for (w in words) words[w] = words[w].charAt(0).toUpperCase() + words[w].slice(1);
    return words.join(' ');
}

fileInputButton.onchange = function () {
    var blocked = false;
    for (var i = 0; i < this.files.length; i++) {
        var file = this.files[i];
        if (!acceptableFileTypes.includes(file.type)) {
            blocked = true;
            continue;
        }
        var textElement = document.createElement('div');
        var element = document.createElement('li');
        textElement.textContent = file.name;
        textElement.alt = file.name;
        element.appendChild(textElement);
        element.className = 'generated';
        fileInputList.appendChild(element);

        fileBuffer.push(file);
    }
    if (blocked) alert('Some files have been blocked due to improper type. (Only .json and .csv files accepted)');
}



document.onclick = function (e) {
    if (Array.from(fileInputList.children).includes(e.target.parentElement)) {
        for (var i = 0; i < fileBuffer.length; i++) {
            if (fileBuffer[i].name === e.target.textContent) {
                fileBuffer.splice(i--, 1);
            }
        }
        fileInputList.removeChild(e.target.parentElement);
        fileInputButton.value = '';
    }
}

async function combineCsv() {
    const files = await parseFiles((fileText) => fileText.split(EOL));
    const header = files[0][0];
    // Reduces the list of files into a list of the data rows (exclude the header) in all files
    const data = files.flatMap((file) => file.slice(1));
    
    // Creates a new array with the first element as the header
    // then dumps the data array into the rest of it
    const csv = [header, ...data].join(EOL);
    return csv;
}

async function combineJsonToCsv() {
    const files = await parseFiles(JSON.parse);
    // Reduces the list of files into a list of the data objects in all files
    const data = files.flat();

    const replacer = (key, value) => value === null ? '' : value;
    const header = Object.keys(data[0]);
    const csv = data.map((dataObject) => {
        // Create CSV row from data object
        return header.map((fieldName) => JSON.stringify(dataObject[fieldName], replacer)).join(',');
    });
    csv.unshift(header.join(','));

    return csv.join(EOL);
}

/**
 * 
 * @param {array} csv The csv
 * @param {string} name The name of the new field
 * @param {function} rowFunction A function which is applied on each row. It takes in the row's index and data
 */
function createArbitraryField(csv, name, rowFunction) {
    // Append the name of this new field to the header of the csv
    csv[0] += `,${name}`;

    const headers = csv[0].split(',');

    // Loop over all of the csv rows with data
    for (let [index, row] of csv.entries()) {
        let rowArray = row.split(',');

        let newData = rowFunction(
            index,
            Object.assign(...headers.map((k, i) => ({ [k]: rowArray[i] })))
        );

        // Append the output to the end of the row
        csv[index] += newData != undefined ? `,${newData}` : '';
    }
}

/**
 * Create a sum field using a function to test whether to use a field or not
 * @param {array} csv The csv
 * @param {string} name The name of the new field
 * @param {function} nameFunction A function which returns a boolean if the field should be summed
 */
function createArbitrarySumField(csv, name, nameFunction) {
    createSumField(csv, name, ...(csv[0].split(',').filter(field => nameFunction(field))));
}

function createSumField(csv, name, ...fields) {
    createArbitraryField(csv, name, (index, row) => {
        if (index === 0) return;

        let total = 0;
        // Loop over all of the fields that we will be adding, and find their data inside of the row
        // Add that data to the total
        for (let field of fields) {
            total += parseInt(row[field]);
        }

        // Return the total to be appended to the end of the row
        return total;
    });
}
async function combineFiles() {
    switch (fileBuffer[0].type) {
        case 'application/json':
        case '.json':
            return await combineJsonToCsv();
        case 'text/csv':
        case '.csv':
            return await combineCsv();
        default:
            alert('Unknown file type in the file combiner.')
            return;
    }
}
function parseFiles(fileParser) {
    var promises = [];
    for (let file of fileBuffer) {
        promises.push(new Promise((resolve, reject) => {
            var reader = new FileReader();
            // Save the file name in each file reader for access later.
            reader.onload = () => {
                let data;
                try {
                    data = fileParser(reader.result);
                } catch (err) {
                    alert('File ' + file.name + ' has parsing errors. Resolve and run again.');
                    reject(err);
                }
                resolve(data);
            }
            reader.onerror = (progress) => reject('File read error. Progress: ', progress);
            reader.readAsText(file);
        }));
    }

    return Promise.allSettled(promises).then((settledPromises) => {
        // Filter out any rejected promises then return a list of the promise values
        return settledPromises
            .filter((promise) => promise.status === 'fulfilled')
            .map((promise) => promise.value);
    });
}

document.getElementById('export-csv-button').addEventListener('click', function () {
    exportCsv();
});

async function exportCsv() {
    // Get all rows in the tbody
    const rows = Array.from(tbody.getElementsByTagName('tr'));

    // Ensure there is data to export
    if (rows.length < 1) {
        alert('No data to export.');
        return;
    }

    try {
        // Get column headers
        const headers = Array.from(thead.getElementsByTagName('th')).map(th => th.textContent);

        // Create an object to store team data and counts for averaging
        const teamData = {};

        // Create CSV content from the table data, including headers
        let content = [headers.join(',')].concat(rows.map(row => {
            const rowData = Array.from(row.cells).map(cell => cell.textContent);
            const team = rowData[0]; // Assuming the first cell contains the team number
            // Initialize the team data if it doesn't exist
            if (!teamData[team]) {
                teamData[team] = {
                    counts: Array(rowData.length - 1).fill(0), // Array to count the number of matches for each column
                    totals: Array(rowData.length - 1).fill(0), // Array to store the total values for each column
                    numericFields: Array(rowData.length - 1).fill(false), // Array to track numerical fields
                };
            }
            // Update counts and totals for each column
            rowData.slice(1).forEach((value, index) => {
                if (!isNaN(value)) { // Check if the value is a number
                    teamData[team].counts[index]++;
                    teamData[team].totals[index] += parseFloat(value);
                    teamData[team].numericFields[index] = true; // Mark as a numeric field
                }
            });
            return rowData.join(',');
        })).join('\n');

        // Ensure there is data to export after combining files
        if (!content || content.trim() === '') {
            alert('No data to export.');
            return;
        }

// Calculate averages for each team for numeric fields and accuracy
const averages = Object.keys(teamData).map(team => {
const autoAccuracy = (autoMade / autoShot) * 100;
const teleopAccuracy = (teleopMade / teleopShot) * 100;
    const teamAverages = teamData[team].totals.map((total, index) => {
        if (teamData[team].numericFields[index] && teamData[team].counts[index] > 0) {
            // Calculate average for numeric fields
            return (total / teamData[team].counts[index]).toFixed(2);
        } else if (headers[index + 1].toLowerCase().includes('accuracy')) {
            // Calculate accuracy if the header contains 'accuracy'
            const shots = teamData[team].totals[index - 1];
            const made = total;
            const accuracy = shots > 0 ? (made / shots) * 100 : 0; // Convert to a percentage
            return accuracy.toFixed(2); // Do not append '%' here
        } else {
            return ''; // Empty string for non-numeric fields
        }
    });
    return `${team},${teamAverages.join(',')}`;
});

// Join all average lines into one string
const averageString = averages.join('\n');

// Append the average table to the content
content += '\n\nAverages\n';
content += averageString;

        // Create a Blob from the CSV content
        const blob = new Blob([content], { type: 'text/csv' });

        // Create a link element to trigger the download
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);

        // Set the filename for the exported CSV file using "VictiScout - MM/DD/YY" format
        const currentDate = new Date();
        const formattedDate = `${currentDate.getMonth() + 1}-${currentDate.getDate()}-${currentDate.getFullYear().toString().slice(-2)}`;
        a.download = `VictiScout_${formattedDate}.csv`;

        // Append the link to the document and trigger the download
        document.body.appendChild(a);
        a.click();

        // Remove the link from the document
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error exporting CSV:', error);
        alert('Error exporting CSV. Please check the console for details.');
    }
}