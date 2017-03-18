const fs = require('fs');

// Define <thead> and <tbody> vars to be filled later on.
var thead = document.getElementsByTagName('thead')[0],
	tbody = document.getElementsByTagName('tbody')[0];

// Fetch (string type) contents of data.json.
render(JSON.parse(fs.readFileSync(localStorage.path)));

function render(data) {
    // Make column headers.
    // Create <tr> element to put everything in.
    var tr = document.createElement('tr');
    // Go through the first data object
    for (var j in data[0]) {
        // Make a new table cell
        var th = document.createElement('th');
        // ...with the content of the name of the data point
	j = j.replace(/-/g, " ")
	j = capitalize(j)
        th.innerHTML = j;
        // Put it into the row
        tr.appendChild(th);
    }
    // Put the row into the table header
    thead.appendChild(tr);

    // For each object in the data array,
    for (i = 0; i < data.length; i++) {
        // Make a new table row
        tr = document.createElement('tr');
        // Go through this data object
        for (var j in data[i]) {
            // Make a table cell for each
            var td = document.createElement('td');
            // Fill table cell with that data
            td.innerHTML = data[i][j];
            // Put the cell into the row
            tr.appendChild(td);
        }
        // Put this row into the document
        tbody.appendChild(tr);
    }
}
function capitalize(str) {
    var pieces = str.split(" ");
    for (i = 0; i < pieces.length; i++) {
        var j = pieces[i].charAt(0).toUpperCase();
        pieces[i] = j + pieces[i].substr(1);
    }
    return pieces.join(" ");
}
