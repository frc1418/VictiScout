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
    outputButton = document.getElementById('csv-button'),
    deleteButton = document.getElementById('delete-button'),
    outputFileName = document.getElementById('output-file'),
    transferButton = document.getElementById('transfer-button');

const acceptableFileTypes = ['application/json', '.json', 'text/csv', 'csv'];
var fileBuffer = [];

if (fs.existsSync(localStorage.path) && fs.statSync(localStorage.path).size > 0) {
    render(JSON.parse(fs.readFileSync(localStorage.path)));
} else {
    // Display "no data" warning if no data is found
    warning.style.display = 'flex';
    processingSection.style.display = 'none';
    deleteButton.style.display = 'none';
}


function render(data) {
    // Make column headers.
    // Create <tr> element to put everything in.
    var tr = document.createElement('tr');
    // Go through the first data object
    for (prop in data[0]) {
        // Make a new table cell
        var th = document.createElement('th');
        // ...with the content of the prettified name of the property
        th.textContent = pname(prop);
        // Put it into the row
        tr.appendChild(th);
    }
    // Put the row into the table header
    thead.appendChild(tr);

    // For each object in the data array,
    for (pt in data) {
        // Make a new table row
        tr = document.createElement('tr');
        var check = document.createElement('input');
        // Go through all properties
        for (prop in data[pt]) {
            // Make a table cell for each
            var td = document.createElement('td');
            // Fill table cell with that data property
            td.textContent = data[pt][prop];
            // Put the cell into the row
            tr.appendChild(td);
        }
        // Put this row into the document
        tbody.appendChild(tr);
        check.className = 'generated'
        tr.appendChild(check);
    }
}

var inputs = document.querySelectorAll('input.generated');
for (elem of inputs) {
    elem.setAttribute('type', 'checkbox');
}

transferButton.onclick = function () {
    ipc.send('transferData');
}

deleteButton.onclick = function () {
    var array = JSON.parse(fs.readFileSync(localStorage.path));
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
    remote.getCurrentWindow().reload();
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
    if (blocked) alert('Some files have been blocked due to improper type. (Only accepting .json or .csv files)');
}

outputButton.onclick = async function () {
    if (fileBuffer.length < 1) {
        return;
    }

    var content = await combineFiles();
    var fd;
    try {
        fd = fs.openSync(localStorage.desktopPath + '/' + (outputFileName.value ? outputFileName.value : 'data') + '.csv', 'a');
        fs.appendFileSync(fd, content);
    } catch (err) {
        if (err) throw err;
    } finally {
        if (fd !== undefined)
            fs.closeSync(fd);
    }
    fileBuffer = [];
    fileInputList.textContent = '';
    outputFileName.value = '';
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
    // Reduces the list of files into a list of the data rows in all files
    const data = files.reduce((array, file) => array = [...file.slice(1), ...array], []);
    
    // Creates a new array with the first element as the header
    // then dumps the data array into the rest of it
    const csv = [header, ...data].join(EOL);
    return csv;
}

async function combineJsonToCsv() {
    const files = await parseFiles(JSON.parse);
    // Reduces the list of files into a list of the data objects in all files
    const data = files.reduce((array, file) => array = [...file, ...array], []);

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
