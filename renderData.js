const fs = require('fs');

var thead = document.getElementsByTagName('thead')[0];
var tbody = document.getElementsByTagName('tbody')[0];

var raw = fs.readFileSync(localStorage.path + '/data.json') + '';

var data = raw.split('\n');

// Replace the string-type data with the JSON parsed version.
for (i = 0; i < data.length - 1; i++) {
    data[i] = JSON.parse(data[i]);
}

// Make column headers.
var tr = document.createElement('tr');
for (var j in data[0]) {
    var td = document.createElement('td');
    td.innerHTML = j;
    tr.appendChild(td);
}
thead.appendChild(tr);

for (i = 0; i < data.length; i++) {
    var tr = document.createElement('tr');
    for (var j in data[i]) {
        var td = document.createElement('td');
        td.innerHTML = data[i][j];
        tr.appendChild(td);
    }
    tbody.appendChild(tr);
}