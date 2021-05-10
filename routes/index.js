var express = require('express');
var router = express.Router();
var path = require('path');
//const csv = require('csv-parser');
const fs = require('fs');
const readline = require('readline');
const bodyParser = require('body-parser');
const {exec} = require("child_process");
const multer = require("multer");
const net = require('net');

var session = require('express-session');
var flash = require('connect-flash');
var auth = require('./auth.js');
const crypto = require('crypto');
const connectEnsureLogin = require('connect-ensure-login');

router.use(session({
    secret: 'some-secret',
    saveUninitialized: false,
    resave: true
}));

// For parsing post request's data/body
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: false}));

// Tells app to use password session
router.use(auth.initialize());
router.use(auth.session());

router.use(flash());

let keyExistence = fs.existsSync('./data/RA/ra_pk.dat');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './data/RA/');
    },

    // By default, multer removes file extensions so let's add them back
    filename: function (req, file, cb) {
        cb(null, file.fieldname);
    }
});

const keyFilter = function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(dat)$/)) {
        req.fileValidationError = 'Only .dat files are allowed!';
        return cb(new Error('Only .dat files are allowed!'), false);
    }
    cb(null, true);
};

function logData(stdout, err, stderr) {
    let date = new Date();
    let dateFormat = date.getFullYear() + '/' + (date.getMonth() < 10 ? '0' : '') + date.getMonth() + '/' + (date.getDate() < 10 ? '0' : '') + date.getDate() + ' ' +
        date.getHours() + ":" + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes() + ":" + (date.getSeconds() < 10 ? '0' : '') + date.getSeconds() + ' ';
    if (err) {
        stdout += '\n' + 'error: ' + err;
    }
    if (stderr) {
        stdout += '\n' + 'stderr: ' + stderr;
    }
    fs.appendFile('./main.log', dateFormat + stdout + '\n', 'utf-8', (err) => {
        if (err) {
            console.log(err);
        }
    });
}

/* TCP Socket for changing epoch */

let currentEpoch = "";

const epochServer = net.createServer((c) => {
    // 'connection' listener.
    let permittedHosts = [];
    try {
        permittedHosts = fs.readFileSync('./permitted-hosts').toString().split("\n");
    } catch (e) {
        console.log(e);
    }
    if (!permittedHosts.includes(c.remoteAddress)) {
        c.end();
        console.log("Client " + c.remoteAddress + " not permitted");
        logData("Client " + c.remoteAddress + " not permitted");
    } else {
        console.log("Client " + c.remoteAddress + " permitted");
        logData("Client " + c.remoteAddress + " permitted");
        c.setEncoding('utf-8');
        c.on('end', () => {
            console.log('client disconnected');
        });
        c.on('data', function (data) {
            console.log(data);
            currentEpoch = data;
            fs.writeFile('./data/RA/ve_epoch_for_RA.dat', data, (err) => {
                if (err) {
                    console.log(err);
                    logData(err);
                }
                console.log("Data written to ./data/RA/ve_epoch_for_RA.dat");
                logData("Data written to ./data/RA/ve_epoch_for_RA.dat");
                const epochActivation = exec('./rkvac-protocol-multos-1.0.0 -r -e');
                epochActivation.stdout.on('data', (data) => {
                    console.log(data);
                    logData(data);
                });
                epochActivation.on('close', () => {
                    let files;
                    files = fs.readdirSync('./data/RA').filter(fn => fn.endsWith('for_verifier.dat'));
                    var readStream = fs.createReadStream('./data/RA/ra_BL_epoch_' + currentEpoch + '_C_for_verifier.dat', 'utf-8');
                    readStream.on('data', (data) => {
                        c.write(data);
                    });
                    readStream.on('error', (err) => {
                        console.log(err);
                        logData(err);
                    });
                    readStream.on('end', () => {
                        c.write(" ");
                        c.end();
                    });
                });
                epochActivation.on('error', (err) => {
                    console.log(err);
                });
            });
        });
        c.on('error', (err) => {
            console.log(err);
        });
        c.setTimeout(10000);
        c.on('timeout', () => {
            console.log("Terminating connection");
            c.end();
        });
    }
});
epochServer.on('error', (err) => {
    console.log(err);
});
epochServer.listen({port: 5004, host: '0.0.0.0', exclusive: true}, () => {
    console.log('server bound');
});

/* GET issuer page. */
router.get('/', connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
    res.render('index');
});

router.get('/verifiers', connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
    res.render('verifiers');
});

router.get('/login', function (req, res, next) {
    // console.log(req.flash('error'));
    let message = JSON.stringify(req.flash('error'));
    if (message !== '[]') {
        let newMessage = message.replace('[', '').replace(']', '').replace('"', '').replace('"', '');
        res.render('login', {message: newMessage});
    } else {
        res.render('login');
    }
});

router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

router.get('/change-password', connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
    res.render('password-form');
});

router.get('/initiateRA', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    fs.mkdir('./data/RA', {recursive: true}, err => {
        if (err) {
            console.log(err);
        }
        logData('RKVAC was initiated');
        res.redirect('/');
    })
});

router.get('/check-data', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    fs.access('./data', fs.F_OK, (err) => {
        if (err) {
            res.json({success: false});
            return
        }
        res.json({success: true});
    })
});

/* RA Functions */

router.get('/check-keys', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    let response = {
        publicKey: false,
        publicParam: false,
        privateKey: false,
        privateParam: false
    }
    fs.access('./data/RA/ra_pk.dat', fs.F_OK, (err) => {
        if (!err) {
            response.publicKey = true;
        }
        fs.access('./data/RA/ra_public_parameters.dat', fs.F_OK, (err) => {
            if (!err) {
                response.publicParam = true;
            }
            fs.access('./data/RA/ra_sk.dat', fs.F_OK, (err) => {
                if (!err) {
                    response.privateKey = true;
                }
                fs.access('./data/RA/ra_parameters.dat', fs.F_OK, (err) => {
                    if (!err) {
                        response.privateParam = true;
                    }
                    res.json({
                        publicKey: response.publicKey,
                        publicParam: response.publicParam,
                        privateKey: response.privateKey,
                        privateParam: response.privateParam
                    });
                });
            });
        });
    });
});


router.get('/downloadPkFile', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    const file = './data/RA/ra_pk.dat';
    res.download(file);
});

router.get('/downloadPubParam', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    const file = './data/RA/ra_public_parameters.dat';
    res.download(file);
});

router.get('/downloadSkFile', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    const file = './data/RA/ra_sk.dat';
    res.download(file);
});

router.get('/downloadParam', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    const file = './data/RA/ra_parameters.dat';
    res.download(file);
});

router.get('/downloadLog', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    const file = './main.log';
    res.download(file);
});

/* POST metods */
router.post('/login',
    auth.authenticate('login', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    })
);

router.use(bodyParser.json());

let rkvacUsed = false;
router.post('/issueHandler', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    if (!rkvacUsed) {
        rkvacUsed = true;
        let command = "./rkvac-protocol-multos-1.0.0 -r";
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.log(`stdout: ${stdout}`);
                console.log(`error: ${error.message}`);
                logData(stdout, error, stderr);
                res.json({success: false});
                rkvacUsed = false;
                return;
            }
            if (stderr) {
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
                logData(stdout, error, stderr);
                res.json({success: true});
                rkvacUsed = false;
                return;
            }
            console.log(`stdout: ${stdout}`);
            logData(stdout, error, stderr);
            res.json({success: true});
            rkvacUsed = false;
        });
    } else {
        res.json({rkvacUsed: true});
    }
});

router.post('/deleteData', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    fs.rmdir('./data', {recursive: true}, err => {
        if (err) {
            console.log(err);
            res.json({success: false});
            return;
        }
        logData('RKVAC was reseted', err);
        res.json({success: true});
    });
});

router.post('/uploadPkFile', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    // 'profile_pic' is the name of our file input field in the HTML form
    let upload = multer({storage: storage, fileFilter: keyFilter}).single("ra_pk.dat");

    upload(req, res, function (err) {
        if (req.fileValidationError) {
            return res.send(req.fileValidationError);
        } else if (!req.file) {
            return res.send('Please select ".dat" file to upload');
        } else if (err instanceof multer.MulterError) {
            return res.send(err);
        } else if (err) {
            return res.send(err);
        }
        logData('ra_pk.dat was uploaded');
        res.redirect('/');
    });
});

router.post('/uploadPubParamFile', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    // 'profile_pic' is the name of our file input field in the HTML form
    let upload = multer({storage: storage, fileFilter: keyFilter}).single("ra_public_parameters.dat");

    upload(req, res, function (err) {
        if (req.fileValidationError) {
            return res.send(req.fileValidationError);
        } else if (!req.file) {
            return res.send('Please select ".dat" file to upload');
        } else if (err instanceof multer.MulterError) {
            return res.send(err);
        } else if (err) {
            return res.send(err);
        }
        logData('ra_public_parameters.dat was uploaded');
        res.redirect('/');
    });
});

router.post('/uploadSkFile', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    // 'profile_pic' is the name of our file input field in the HTML form
    let upload = multer({storage: storage, fileFilter: keyFilter}).single("ra_sk.dat");

    upload(req, res, function (err) {
        if (req.fileValidationError) {
            return res.send(req.fileValidationError);
        } else if (!req.file) {
            return res.send('Please select ".dat" file to upload');
        } else if (err instanceof multer.MulterError) {
            return res.send(err);
        } else if (err) {
            return res.send(err);
        }
        logData('ra_sk.dat was uploaded');
        res.redirect('/');
    });
});

router.post('/uploadParamFile', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    // 'profile_pic' is the name of our file input field in the HTML form
    let upload = multer({storage: storage, fileFilter: keyFilter}).single("ra_parameters.dat");

    upload(req, res, function (err) {
        if (req.fileValidationError) {
            return res.send(req.fileValidationError);
        } else if (!req.file) {
            return res.send('Please select ".dat" file to upload');
        } else if (err instanceof multer.MulterError) {
            return res.send(err);
        } else if (err) {
            return res.send(err);
        }
        logData('ra_parameters.dat was uploaded');
        res.redirect('/');
    });
});

router.post('/deleteFile', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    fs.unlink('./data/RA/' + req.body.fileName, (err) => {
        if (err) {
            console.error(err)
            return
        }
        logData('./data/RA/' + req.body.fileName + ' was deleted');
        res.json({success: true});
    })
});

router.post('/post-revoke-user-ID', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    currentEpoch = fs.readFileSync('./data/RA/ve_epoch_for_RA.dat');
    let command = './rkvac-protocol-multos-1.0.0 -r -B "' + currentEpoch + ' ' + req.body.id + '"';
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.log(`stdout: ${stdout}`);
            console.log(`error: ${error.message}`);
            logData(stdout, error, stderr);
            res.json({success: false});
            return;
        }
        if (stderr) {
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
            logData(stdout, error, stderr);
            res.json({success: false});
            return;
        }
        let verifiers = req.body.verifierAddress.split(',');
        for (const verifier of verifiers) {
            let socket = new net.createConnection({port: 5003, host: verifier});
            socket.setEncoding('utf-8');
            socket.on('connect', function () {
                console.log("Connected to server");
                var readStream = fs.createReadStream('./data/RA/ra_BL_epoch_' + currentEpoch + '_C_for_verifier.dat', 'utf-8');
                readStream.on('data', (data) => {
                    socket.write(data);
                });
                readStream.on('end', () => {
                    socket.end();
                });
            });
            socket.on('error', function (error) {
                console.log("Terminating connection: " + error);
                socket.destroy();
            });
            socket.on('end', function () {
                console.log("Disconnected from server");
            });
            socket.setTimeout(10000);
            socket.on('timeout', () => {
                console.log("Terminating connection");
                socket.end();
            });
        }
        console.log(`stdout: ${stdout}`);
        logData(stdout, error, stderr);
        res.json({success: true});
    });
});


router.post('/post-revoke-user-C', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    let command = './rkvac-protocol-multos-1.0.0 -r -b "' + req.body.epoch + ' ' + req.body.C + '"';
    currentEpoch = req.body.epoch;
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.log(`stdout: ${stdout}`);
            console.log(`error: ${error.message}`);
            logData(stdout, error, stderr);
            res.json({success: false});
            return;
        }
        if (stderr) {
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
            logData(stdout, error, stderr);
            res.json({success: false});
            return;
        }
        console.log(`stdout: ${stdout}`);
        let verifiers = req.body.verifierAddress.split(',');
        for (const verifier of verifiers) {
            let socket = new net.createConnection({port: 5003, host: verifier});
            socket.setEncoding('utf-8');
            socket.on('connect', function () {
                console.log("Connected to server");
                var readStream = fs.createReadStream('./data/RA/ra_BL_epoch_' + currentEpoch + '_C_for_verifier.dat', 'utf-8');
                readStream.on('data', (data) => {
                    socket.write(data);
                });
                readStream.on('end', () => {
                    socket.end();
                });
            });
            socket.on('error', function (error) {
                console.log("Terminating connection: " + error);
                socket.destroy();
            });
            socket.on('end', function () {
                console.log("Disconnected from server");
            });
            socket.setTimeout(10000);
            socket.on('timeout', () => {
                console.log("Terminating connection");
                socket.end();
            });
        }
        logData(stdout, error, stderr);
        res.json({success: true});
    });
});

// Change password
const getHashedPassword = (password) => {
    const sha256 = crypto.createHash('sha256');
    return sha256.update(password).digest('base64');
}

router.post('/change-password', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    fs.readFile('./passwd', (err, data) => {
        if (err) {
            console.log(err);
            res.render('password-form', {message: "Request failed"});
            return;
        }
        if (data.toString() !== getHashedPassword(req.body.passwordOld)) {
            res.render('password-form', {message: "Bad old password"});
            return;
        }
        if (req.body.passwordNew !== req.body.passwordNew2) {
            res.render('password-form', {message: "New passwords don't match"});
            return;
        }
        fs.writeFile('./passwd', getHashedPassword(req.body.passwordNew), err1 => {
            if (err1) {
                console.log(err1);
                res.render('password-form', {message: "Request failed"});
                return;
            }
            res.render('password-form', {successMessage: "Password changed"});
        });
    });
});

// Verifiers
const verifiersData = {
    headers: ["Host", ""],
    rows: []
};

function loadVerifiers(userFile) {
    return new Promise((resolve, reject) => {
        try {
            const fileStream = fs.createReadStream(userFile).on('error', reject);
            readline.createInterface({
                input: fileStream,
                console: false
            }).on('line', function (line) {
                if (line !== '') {
                    verifiersData.rows.push(line);
                }
            }).on('close', function () {
                resolve(verifiersData);
            });
        } catch (e) {
            reject(e);
        }
    });
}

router.get('/refreshList', connectEnsureLogin.ensureLoggedIn(), function (req, res) {
    verifiersData.rows = [];
    loadVerifiers('./permitted-hosts').then((data) => {
        res.json({
            headers: data.headers,
            rows: data.rows
        })
    }).catch(err => {
        res.json({
            success: false
        })
        console.log('Error: ' + err);
    })
});

router.post('/delete-verifier', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    try {
        let verifiers = fs.readFileSync('./permitted-hosts').toString().split("\n");
        fs.rmSync('./permitted-hosts');
        for (const verifier of verifiers) {
            if (verifier !== req.body.hostname) {
                fs.appendFileSync('./permitted-hosts', verifier + '\n', 'utf-8');
            }
        }
        res.json({success: true});
    } catch (e) {
        console.log(e);
        res.json({success: false});
    }
});

router.post('/add-verifier', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    fs.appendFile('./permitted-hosts', req.body.hostname + '\n', 'utf-8', (err) => {
        if (err) {
            console.log(err);
            res.json({success: false});
            return;
        }
        console.log("Host added to permitted hosts");
        res.json({success:true});
    });
});

module.exports = router;
