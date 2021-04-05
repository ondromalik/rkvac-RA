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

/* TCP Socket for changing epoch */

let currentEpoch = "";

// async function activateEpoch() {
//     return exec('./rkvac-protocol-multos-1.0.0 -r -e');
// }

const epochServer = net.createServer((c) => {
    // 'connection' listener.
    console.log('client connected');
    c.setEncoding('utf-8');
    c.on('end', () => {
        console.log('client disconnected');
    });
    c.on('data', function (data) {
        console.log(data)
        currentEpoch = data;
        fs.writeFile('./data/RA/ve_epoch_for_RA.dat', data, (err) => {
            if (err) {
                console.log(err);
            }
            console.log("Data written to ./data/RA/ve_epoch_for_RA.dat");
            const epochActivation = exec('./rkvac-protocol-multos-1.0.0 -r -e');
            epochActivation.stdout.on('data', (data) => {
               console.log(data);
            });
            epochActivation.on('close', () => {
                let files;
                files = fs.readdirSync('./data/RA').filter(fn => fn.endsWith('for_verifier.dat'));
                var readStream = fs.createReadStream('./data/RA/' + files[0], 'utf-8');
                readStream.on('data', (data) => {
                    c.write(data);
                });
                readStream.on('error', (err) => {
                    console.log(err);
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
});
epochServer.on('error', (err) => {
    throw err;
});
epochServer.listen(5001, () => {
    console.log('server bound');
});

/* TCP Socket for user revocation */

let socket = new net.Socket();
socket.setEncoding('utf-8');
const connect = (server) => {
    socket.connect(5002, server)
};
socket.once('connect', function () {
    console.log('Connected to server!');
    var readStream = fs.createReadStream('./data/RA/ra_BL_epoch_' + currentEpoch + '_C_for_verifier.dat', 'utf-8');
    readStream.on('data', (data) => {
        socket.write(data);
    });
});
socket.on('error', function (error) {
    console.log("Terminating connection: " + error);
    socket.end();
});
socket.on('end', function () {
    console.log("Disconnected from server");
});

/* GET issuer page. */
router.get('/', connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
    res.render('index', {epoch: currentEpoch});
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
})

router.get('/check-data', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    fs.access('./data', fs.F_OK, (err) => {
        if (err) {
            res.sendStatus(404);
            return
        }
        res.sendStatus(200);
    })
});

/* RA Functions */

router.get('/check-ra-key-RA', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    fs.access('./data/RA/ra_pk.dat', fs.F_OK, (err) => {
        if (err) {
            res.sendStatus(503);
            console.error(err)
            return
        }
        res.sendStatus(200);
    })
});


router.get('/downloadRAKey', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    const file = './data/RA/ra_pk.dat';
    res.download(file);
});

router.get('/downloadRAParam', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    const file = './data/RA/ra_public_parameters.dat';
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

router.post('/initiateRA', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    let command = "./rkvac-protocol-multos-1.0.0 -r";
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.log(`stdout: ${stdout}`);
            console.log(`error: ${error.message}`);
            res.sendStatus(503);
            return;
        }
        if (stderr) {
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
            res.sendStatus(200);
            return;
        }
        console.log(`stdout: ${stdout}`);
        res.sendStatus(200);
    });
});

router.post('/post-revoke-user-ID', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    let command = './rkvac-protocol-multos-1.0.0 -r -B "' + req.body.epoch + ' ' + req.body.id + '"';
    currentEpoch = req.body.epoch;
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.log(`stdout: ${stdout}`);
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        connect(req.body.verifierAddress);
    });
    res.redirect('/');
});

module.exports = router;
