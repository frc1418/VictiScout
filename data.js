const remote = require('electron').remote;
const fs = require('fs');

// Define <thead>, <tbody>, warning, and match deletion vars to be filled later on.
var thead = document.getElementsByTagName('thead')[0],
    tbody = document.getElementsByTagName('tbody')[0],
    warning = document.getElementById('warning'),

    processingSection = document.getElementById('processing'),
    fileInputButton = document.getElementById('input-file'),
    fileInputList = document.getElementById('input-list'),
    outputButton = document.getElementById('csv-button'),
    button = document.getElementById('delete-button'),
    outputFileName = document.getElementById('output-file');

var fileBuffer = [];

if (fs.existsSync(localStorage.path) && fs.statSync(localStorage.path).size > 0) {
    render(JSON.parse(fs.readFileSync(localStorage.path)));
} else {
    // Display "no data" warning if no data is found
    warning.style.display = 'block';

    combineFilesSection.parentElement.style.display = 'none';

    button.style.display = 'none';

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
        th.innerHTML = pname(prop);
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
            td.innerHTML = data[pt][prop];
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

button.onclick = function() {
    var array = JSON.parse(fs.readFileSync(localStorage.path));
    for (box of inputs) {
        if (box.checked) {
            var matchnum = 0;
            matchnum = (parseInt(box.parentNode.childNodes[1].textContent));
            for (index in array) {
                if (array[index].match === matchnum) {
                    array.splice(index, 1);
                  }
              }
          }
      }
      fs.writeFileSync(localStorage.path, JSON.stringify(array).replace(/[""]/, '"'));
      remote.getCurrentWindow().reload();
}

function pname(str) {
    var words = str.split('-');
    for (w in words) words[w] = words[w].charAt(0).toUpperCase() + words[w].slice(1);
    return words.join(' ');
}

fileInputButton.onchange = function() {
    var blocked = false;
    for (var i = 0; i < this.files.length; i++) {
        var file = this.files[i];
        if (file.type !== 'application/json') {
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
    if (blocked) alert('Some files have been blocked due to improper type. (Only accepting .json files)');
}

outputButton.onclick = async function() {
    var content = await makeCSV();
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
    fileInputList.innerHTML = '';
    outputFileName.value = '';
}

document.onclick = function(e) {
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

async function makeCSV() {
    var data = await combineFiles();

    const items = data;
    const replacer = (key, value) => value === null ? '' : value;
    const header = Object.keys(items[0]);
    let csv = items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
    csv.unshift(header.join(','));
    csv = csv.join('\r\n');

    return csv;
}

function combineFiles() {
    var promises = [];
    for (file of fileBuffer) {
        promises.push(new Promise((resolve, reject) => {
            var reader = new FileReader();
            // Save the file name in each file reader for access later.
            reader.file = file.name;
            reader.onload = () => {
                var data = [];
                try {
                    data = JSON.parse(reader.result);
                } catch (err) {
                    alert('File ' + reader.file + ' has parsing errors. Resolve and run again.');
                }
                resolve(data);
            }
            reader.onerror = () => resolve([]);
            reader.readAsText(file);
        }));
    }
    return Promise.all(promises).then((resolvedData) => {
        return new Promise((resolve, reject) => {
            var data = [];
            for (file of resolvedData) {
                for (object of file) {
                    data.push(object);
                }
            }
            resolve(data);
        });
    });
}
