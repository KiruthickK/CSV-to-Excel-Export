/**
 * form have been submitted
 */
var colFinal;
window.onload = () => {
    fetch('/getColoumns')
        .then(response => response.json())
        .then(data => {
            const cols = data.columns;
            var c = cols.split(",");
            LoadCheckBoxes(c);
            colFinal = c;
        })
        .catch(error => {
            console.error('Error:', error);
        });
}
function LoadCheckBoxes(cols) {
    const parentDiv = document.getElementById('check-box');
    for (const col of cols) {
        var data = `
            <div class="form-check" id="">
            <input class="form-check-input input-check-box" type="checkbox" value="${col}" id="${col}">
            <label class="form-check-label" for="flexCheckDefault">
                ${col}
            </label>
            </div>
        `;
        var check = document.createElement('div');
        check.innerHTML = data;
        parentDiv.appendChild(check);
    }
}
function FullExport() {
    console.log(colFinal)
    fetch('/completeExport', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(colFinal),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.blob(); // Parse the response as a Blob
        })
        .then((blob) => {
            // Create a URL for the Blob
            const url = window.URL.createObjectURL(blob);
            // Create a link element to trigger the download
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Exported.xlsx';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            // Clean up the temporary URL and link element
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            alert("Exported Excel downloaded!");
        })
        .catch((error) => {
            console.error('Fetch Error:', error);
        });

}
function convertWithOptions() {
    var selectedValues = [];
    // Get all checkboxes by their IDs
    var checkboxes = document.querySelectorAll('input[type="checkbox"]');
    var i = 0;
    checkboxes.forEach(function (checkbox) {
        if (checkbox.checked) {
            selectedValues[i] = checkbox.value;
            // selectedValues.push(checkbox.value);
        }
        i++;

    });
    console.log(selectedValues)
    sendRequestForSelectedDownload(selectedValues);
}

function sendRequestForSelectedDownload(selectedValues) {
    fetch('selectedColoumnsExport', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json', // Specify the content type as JSON
        },
        body: JSON.stringify(selectedValues), // Convert the data to JSON format
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.blob(); // Parse the response as a Blob
        })
        .then((blob) => {
            // Create a URL for the Blob
            const url = window.URL.createObjectURL(blob);
            // Create a link element to trigger the download
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Exported.xlsx';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            // Clean up the temporary URL and link element
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            alert("Exported Excel downloaded!");
        })
        .catch((error) => {
            console.error('Fetch Error:', error);
        });
}
