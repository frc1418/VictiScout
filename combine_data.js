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

outputButton.onclick = function() {
    var data = makeCSV();
    //console.log(data);
    return;
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
    console.log(data.data);
}

function combineFiles() {
    var combinedData = [];
    var reader = new FileReader();
    return new Promise((resolve, reject) => {
        for (file of fileBuffer) {
            var readData;
            try {
                reader.onload = () => resolve({data: JSON.parse(reader.result)});
                reader.onerror = () => reject(result.error);
                reader.readAsText(file);
            } catch (err) {
                alert('File ' + file.name + ' has parsing errors. Resolve and run again.');
                continue;
            }
        }
    }).then((resolvedData) => {
        return new Promise((resolve, reject) => {
            resolve({data: combinedData.concat(resolvedData.data)});
        });
    });
}
