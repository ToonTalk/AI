// file name of the weather data API
let weatherDataURL = 'chicago_weather_weekly.csv';

// file name of the influenza data API
let influenzaDataURL = 'illinois_flu.csv';

let weatherData;
let fluData;

function displayData(data, title, containerId, numRows) {
    // Get the container where the table will be created
    var container = document.getElementById(containerId);

    // Create a new table
    var table = document.createElement("table");

    // Add a title to the table
    var caption = table.createCaption();
    caption.textContent = title;

    // Create the table header
    var thead = table.createTHead();
    var headerRow = thead.insertRow();
    for (var key in data.data[0]) {
        var th = document.createElement("th");
        var text = document.createTextNode(key);
        th.appendChild(text);
        headerRow.appendChild(th);
    }

    // Create the table body
    var tbody = table.createTBody();

    // Insert numRows rows of data into the table body
    for (var i = 0; i < numRows; i++) {
        var row = tbody.insertRow();
        for (var key in data.data[i]) {
            var td = document.createElement("td");
            var text = document.createTextNode(data.data[i][key]);
            td.appendChild(text);
            row.appendChild(td);
        }
    }

    // Append the table to the container
    container.appendChild(table);
}

function mergeData(weatherData, fluData) {
    let mergedData = [];

    for (let weatherRow of weatherData.data) {
        let weatherYear = new Date(weatherRow.DATE).getFullYear();

        for (let fluRow of fluData.data) {
            // Log the year and week values for debug
            if (weatherYear === fluRow.YEAR && weatherRow.WEEK === fluRow.WEEK) {
                let mergedRow = {...weatherRow, ...fluRow};
                mergedRow.YEAR = weatherYear;

                // Debug log: log the merged row
                console.log('Merged row:', mergedRow);

                mergedData.push(mergedRow);
                break;
            }
        }
    }

    // Debug log: log the number of merged rows
    console.log('Number of merged rows:', mergedData.length);

    return {data: mergedData, errors: [], meta: {}};
}

function getWeekFromDate(dateString) {
    const date = new Date(dateString);
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function mergeData(weatherData, fluData) {
    let mergedData = [];
    for(let i = 0; i < fluData.data.length; i++) {
        let fluRow = fluData.data[i];
        let fluYear = fluRow.YEAR;
        let fluWeek = fluRow.WEEK;
        for(let j = 0; j < weatherData.data.length; j++) {
            let weatherRow = weatherData.data[j];
            let weatherYear = new Date(weatherRow.DATE).getFullYear();
            let weatherWeek = getWeekFromDate(weatherRow.DATE);
            if(weatherYear === fluYear && weatherWeek === fluWeek) {
                let mergedRow = {...weatherRow, ...fluRow};
                mergedData.push(mergedRow);
                break;
            }
        }
    }
    return {
        data: mergedData,
        errors: [],
        meta: {}
    };
}

function downloadCSV(data, fileName) {
    // Convert the JSON data to CSV format
    const csvData = Papa.unparse(data);

    // Create a Blob with the CSV data and get its URL
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    // Create a download link and click it
    const link = document.createElement('a');
    link.download = fileName;
    link.href = url;
    link.click();
}

function loadFile(fileInputId) {
    return new Promise((resolve, reject) => {
        const fileInput = document.getElementById(fileInputId);
        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            const contents = e.target.result;
            const csvData = Papa.parse(contents, { header: true, dynamicTyping: true });
            resolve(csvData);
        };

        reader.onerror = function(e) {
            reject(e);
        };

        reader.readAsText(file);
    });
}

function loadFiles() {
    Promise.all([
        loadFile('weatherDataFile'),
        loadFile('fluDataFile')
    ])
    .then(([weatherData, fluData]) => {
        console.log('Weather data loaded:', weatherData);
        console.log('Flu data loaded:', fluData);

        // Merge the datasets
        let mergedData = mergeData(weatherData, fluData);

        // Display the first 5 rows of the data
        displayData(weatherData, 'Weather Data', 'displayArea', 5);
        displayData(fluData, 'Flu Data', 'displayArea', 5);
        displayData(mergedData, 'Merged Data', 'displayArea', 5);

        // Save the merged data as a CSV file
        downloadCSV(mergedData.data, 'merged_data.csv');
    })
    .catch(error => {
        console.error('Error loading files:', error);
    });
}





