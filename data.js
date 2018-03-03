const fs = require('fs');

// Define <thead>, <tbody>, and warning vars to be filled later on.
var thead = document.getElementsByTagName('thead')[0],
    tbody = document.getElementsByTagName('tbody')[0],
    warning = document.getElementById('warning');

if (fs.existsSync(localStorage.path) && fs.statSync(localStorage.path).size > 0) {
    render(JSON.parse(fs.readFileSync(localStorage.path)));
} else {
    // Display "no data" warning if no data is found
    warning.style.display = 'block';
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
    }
}

function pname(str) {
    var words = str.split('-');
    for (w in words) words[w] = words[w].charAt(0).toUpperCase() + words[w].slice(1);
    return words.join(' ');
}
