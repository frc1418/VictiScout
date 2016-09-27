const fs = require('fs');
const unirest = require('unirest');

// Define <thead> and <tbody> vars to be filled later on.
var thead = document.getElementsByTagName('thead')[0],
	tbody = document.getElementsByTagName('tbody')[0];

console.log(localStorage.target);

if (localStorage.target === 'Save data locally') {
	// Fetch (string type) contents of data.json.
	var raw = fs.readFileSync(localStorage.path + '/data.json') + '';

	// Split up the single long string into an array of strings. One string = one object = one submission of data.
	var data = raw.split('\n');

    render();
} else {
	unirest.get('http://0.0.0.0:8080/api/data')
		.end(function(response) {
            console.log(response.body);
			var raw = JSON.parse(response.body[0]); //JSON.parse(response.body).data);
            render();
		});
}
function render() {
    // Go through data array and turn string data into a manipulable JSON object
    for (i = 0; i < data.length - 1; i++) {
        data[i] = JSON.parse(data[i]);
    }

    // Make column headers.
    // Create <tr> element to put everything in.
    var tr = document.createElement('tr');
    // Go through the first data object
    for (var j in data[0]) {
        // Make a new table cell
        var th = document.createElement('th');
        // ...with the content of the name of the data point
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