const fs = require('fs');

var fileInput = document.getElementById('file-input'),
    fileList = document.getElementById('file-list'),
    outputButton = document.getElementById('csv-button'),
    fileName = document.getElementById('output-file');

var fileBuffer = [];

fileInput.onchange = function() {
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
        fileList.appendChild(element);

        fileBuffer.push(file);
    }
    if (blocked) alert('Some files have been blocked due to improper type. (Only accepting .json files)');
}

outputButton.onclick = async function() {
    var content = await makeCSV();
    fs.appendFile((fileName.value ? fileName.value : 'data') + '.csv', content, function (err) {
      if (err) throw err;
      console.log('Saved file.');
    });
}

document.onclick = function(e) {
    if (Array.from(fileList.children).includes(e.target.parentElement)) {
        for (var i = 0; i < fileBuffer.length; i++) {
            if (fileBuffer[i].name === e.target.textContent) {
                fileBuffer.splice(i--, 1);
            }
        }
        fileList.removeChild(e.target.parentElement);
        fileInput.value = '';
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
            try {
                reader.onload = () => resolve(JSON.parse(reader.result));
                reader.onerror = () => reject(reader.error);
                reader.readAsText(file);
            } catch (err) {
                alert('File ' + file.name + ' has parsing errors. Resolve and run again.');
                reject(err);
            }
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
