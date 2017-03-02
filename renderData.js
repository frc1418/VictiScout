const fs = require('fs');
const unirest = require('unirest');

// Define <thead> and <tbody> vars to be filled later on.
var thead = document.getElementsByTagName('thead')[0],
    tbody = document.getElementsByTagName('tbody')[0];

console.log(localStorage.target);

if (localStorage.target === 'Save data locally') {
    // Fetch (string type) contents of data.json.
    var values = fs.readFileSync(localStorage.path + '/data.json') + '';

    // Split up the single long string into an array of strings. One string = one object = one submission of data.
    values = values.split('\n');

    render(values);
} else {
    unirest.get('http://' + localStorage.path + ':8080/api/data').end(function(response) {
        var values = response.body;
        values = values.split('\n');

        render(values);
    });
}


function render(data) {
    // Go through data array and turn string data into a manipulable JSON object
    for (i = 0; i < data.length - 1; i++) {
        data[i] = JSON.parse(data[i]);
    }


    // Make column headers.
    // Create <tr> element to put everything in.
    var tr = document.createElement('tr');
    // Go through the first data object
    for (var j in data[0]) {
        j = j.replace(/-/, ' ');
        j = j.replace(/-/, ' ');
        j = j.replace(/-/, ' ');
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
            // Set the class to whatever the column header is
            td.className = j
            // Put the cell into the row
            tr.appendChild(td);
        }
        // Put this row into the document
        tbody.appendChild(tr);
    }

/*
    var dict = [];
    var minorDict = [];
    //var table = document.getElementById('t')
    //var rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    var lowboilers = [];
    /*for (var i; i<=rows.length; i++){
        //console.log(i);
        if (i != 0){
            //lowboilers.push(rows[i][4]);
        }
    }*/
    console.log(data);
    for (i = 0; i < data.length; i++){
        console.log()
        lowboilers.push(data[i]['low-boiler']);
    }
    console.log(lowboilers)
    /*var k = 0;
    for (i = 0; i < values.length; i++) {
        for (var j in values[i]) {

            var column = table.getElementsByTagName('tbody')[0].getElementsByClassName(j)[i]
             dict.push([j, column.innerHTML]);
            k++;
            }
    }
    var sum = -1;
    var majorDict = [];
    for (var i in dict) {
        i = parseInt(i);
        if ((i+1)%20 == 0 && i != 0) {
            sum = sum+20
        }

        else {
            // TODO: Erik don't touch this, despite being a comment it is esential to the functioning of the code
            // console.log('You done fucked up! i = ' + (i+1));
        }

        majorDict.push([sum, dict[i][1]]);
        minorDict.push(majorDict[i][1])
    }
    var superDict = [];
    var subDict = [];
    for (var i = 0; i<=minorDict.length; i++){
        if (i%20 == 0 && i != 0){
            superDict.push(subDict);
            subDict = [];
            subDict.push(minorDict[i])
        }
        else {
            subDict.push(minorDict[i]);
        }
    }
    // s_  => total
    // s_c => counter
    var s4 = 0
    var s4c = 0
    var s5 = 0
    var s5c = 0
    var s6 = 0
    var s6c = 0
    var s7 = 0
    var s7c = 0
    var s9 = 0
    var s9c = 0
    var s10 = 0
    var s10c = 0
    var s11 = 0
    var s11c = 0
    var s12 = 0
    var s12c = 0
    var s13 = 0
    var s13c = 0
    var s14 = 0
    var s14c = 0
    var s16 = 0
    var s16c = 0
    var s17 = 0
    var s17c = 0
    var s18 = 0
    var s18c = 0
    for (var i in superDict) {
        for (var j in superDict[i]) {
            switch(j) {
                case 4: // low-boiler
                    var s4 = parseInt(s4) + parseInt(superDict[i][j]);
                    s4c++

                case 5: //
                    var s5 = parseInt(s5) + parseInt(superDict[i][j]);
                    s5c++

                case 6:
                    var s6 = parseInt(s6) + parseInt(superDict[i][j]);
                    s6c++

                case 7:
                    var s7 = parseInt(s7) + parseInt(superDict[i][j]);
                    s7c++

                case 9:
                    var ref = superDict[i][j];
                    var s9 = parseInt(s9) + parseInt(ref.replace(/%/, ""));
                    s9c++

                case 10:
                    var ref = superDict[i][j];
                    var s10 = parseInt(s10) + parseInt(ref.replace(/%/, ""));
                    s10c++

                case 11:
                    var ref = superDict[i][j];
                    var s11 = parseInt(s11) + parseInt(ref.replace(/ kPa/, ""));
                    s11c++

                case 12:
                    var s12 = parseInt(s12) + parseInt(superDict[i][j]);
                    s12c++

                case 13:
                    var s13 = parseInt(s13) + parseInt(superDict[i][j])
                    s13c++
                case 14:
                    var s14 = parseInt(s14) + parseInt(superDict[i][j])
                    s14c++
                case 16:
                    var s16 = parseInt(s16) + parseInt(superDict[i][j])
                    s16c++
                case 17:
                    var s17 = parseInt(s17) + parseInt(superDict[i][j])
                    s17c++
                case 18:
                    var s18 = parseInt(s18) + parseInt(superDict[i][j])
                    s18c++
            }
        }
    }
    s4 = s4/s4c
    s5 = s5/s5c
    s6 = s6/s6c
    s7 = s7/s7c
    s9 = s9/s9c
    s10 = s10/s10c
    s11 = s11/s11c
    s12 = s12/s12c
    s13 = s13/s13c
    s14 = s14/s14c
    s16 = s16/s16c
    s17 = s17/s17c
    s18 = s18/s18c



    */
    //}*/
}
// For each thing with the same % combine that into one dict
