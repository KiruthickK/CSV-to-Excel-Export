//importing libraries
const express = require('express');
const cons = require('consolidate');   //consolidate for html rendering 
const multer = require("multer") //for file upload from client to server
const fs = require('fs');   //for file system operations in client side
const csv = require("csv-parse"); //for parsing csv file to export into excel sheets
const readline = require('readline');   //for reading csv file line by line
const ExcelJS = require('exceljs'); //for writing and saving excel files
const path = require('path');   //for getting system path
const bodyParser = require('body-parser');  //for parsing the json request from client side

//creating express app in node js and setting the environment with html, and basic website settings, view engiene etc
const app = express();
app.use(bodyParser.json());
app.engine('html', cons.swig);
app.set('views', './public/HTML'); //setting default html files will be located  inside html folder
app.set('view engine', 'html'); //setting default engine as .html
app.use("/styles", express.static(__dirname + '/public/Styles')); //for assigning static folder for styles
app.use("/scripts", express.static(__dirname + "/public/Scripts")); //for assigning static folders for script files

//hosting the server on port 8080
app.listen(8080);

//rendering index page for default request
app.get('/', (req, res) => {
    res.render('index');
});

//for storing the latest file name (csv file)
var FileName;

//function for clearing old uploaded csv files after client leaves the web page and visit again
async function clearOldFiles(dirName) {
    fs.readdir(dirName, (err, files) => {
        if (err) throw err;
        for (const file of files) {
            fs.unlink(path.join(dirName, file), (err) => {
                if (err) throw err;
            });
        }
    });
}

//function to read the first line in the csv file and return the coloumn names to the client to allow them to choose the coloumns
async function getColumNames() {
    return new Promise((resolve, reject) => {
        fs.readdir('UploadedFiles', (err, files) => {
            if (err) throw err;
            if (files.length == 0) {
                return -1;
            } else {
                const fileStream = fs.createReadStream('UploadedFiles\\' + FileName);

                // Create a readline interface to read the file line by line
                const rl = readline.createInterface({
                    input: fileStream,
                    crlfDelay: Infinity, // To handle both \r\n and \n line endings
                });

                // Read the first line of the CSV file
                rl.once('line', (line) => {
                    // Process the first line here
                    rl.close();
                    line = line.replace(new RegExp('"', 'g'), '');
                    console.log(line);
                    resolve(line);
                    // Close the readline interface
                });
            }
        });
    })
}

//function for uplaoding the csv file (defining storage from multer library)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'UploadedFiles/'); // Directory to store uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Use the original filename
        console.log(file.originalname);
        FileName = file.originalname;
    },
});

// Create a multer middleware for file upload
const upload = multer({ storage });

//post request for file uploading 
app.post('/FileUploaded', async (req, res) => {
    //for clearing old files first, and then we uploading the newly uploaded files
    await clearOldFiles('UploadedFiles').then(() => {
        clearOldFiles('UploadedFiles').then(() => {//OutputFiles
            upload.single('FileInput')(req, res, async function (err) {
                if (err) {
                    // Handle any errors that occurred during file upload
                    console.error('File upload error:', err);
                    return res.status(500).send('File upload failed');
                }
                //after uploading redirecting the user to export page where they can have options to upload
                res.render('exportPage');
                // res.send('File uploaded successfully!');
                console.log("File received and processed successfully");
            });
        })
    })

});

//get request to simply send the coloumn names, we already parsed from csv file
app.get('/getColoumns', async (req, res) => {
    getColumNames().then((cols) => {
        const resData = {
            columns: cols
        }
        res.json(resData);
    });
});

//only selected coloumns export option
app.post('/selectedColoumnsExport', (req, res) => {
    console.log(req.body);
    var row = []
    var indices = []
    for (var i = 0; i < req.body.length; i++) {
        if (req.body[i] != null) {
            row.push(req.body[i]);
            indices.push(i);
        }
    }
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet 1');
    worksheet.addRow(row);
    //parsing the csv file and writing 
    fs.createReadStream("./UploadedFiles/" + FileName)
        .pipe(csv.parse({ delimiter: ",", from_line: 2 }))
        .on("data", function (row) {
            // console.log(row.length);
            var i = 0;
            var dat = []
            for (var data of row) {
                if (i in indices) {
                    dat.push(data);
                }
                i++;
            }
            worksheet.addRow(dat);
        })
        .on("error", function (error) {
            console.log(error.message);
        })
        .on("end", function () {
            //at the end we are saving and make it downloadable for client
            console.log("finished");
            workbook.xlsx.writeFile("./OutputFiles/output.xlsx")
                .then(() => {
                    const filePath = path.join(__dirname, '/OutputFiles/output.xlsx');
                    const fileName = 'Exported.xlsx';

                    // Send the file for download
                    res.download(filePath, fileName, (err) => {
                        if (err) {
                            console.error('Error sending file:', err);
                            res.status(500).send('Error downloading the file');
                        } else {
                            console.log('File sent successfully');
                        }
                    });
                })
        });
});

//same for full export excel file
app.post('/completeExport', (req, res) => {
    const cols = req.body;
    console.log(cols)
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet 1');
    worksheet.addRow(cols);
    fs.createReadStream("./UploadedFiles/" + FileName)
        .pipe(csv.parse({ delimiter: ",", from_line: 2 }))
        .on("data", function (row) {
            // console.log(row.length);
            worksheet.addRow(row);
        })
        .on("error", function (error) {
            console.log(error.message);
        })
        .on("end", function () {
            console.log("finished");
            workbook.xlsx.writeFile("./OutputFiles/output.xlsx")
                .then(() => {
                    const filePath = path.join(__dirname, '/OutputFiles/output.xlsx');
                    const fileName = 'Exported.xlsx'; // Replace with the desired file name

                    // Send the file for download
                    res.download(filePath, fileName, (err) => {
                        if (err) {
                            console.error('Error sending file:', err);
                            res.status(500).send('Error downloading the file');
                        } else {
                            console.log('File sent successfully');
                        }
                    });
                })
        });
});

console.log("Listening.. on port 8080...")