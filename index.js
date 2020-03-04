#!/usr/bin/env node

const net = require('net');
const express = require('express');
const bodyParser = require('body-parser');
const exec = require('child_process').exec;
require('dotenv').config();

const app = express();

const ModbusRTU = require("modbus-serial");

app.use(bodyParser.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*" );
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, x-requested-with");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
});


//client for Modbus serial connection
const client = new ModbusRTU();
client.setID(255);
client.setTimeout(1000);

// Create shutdown function
function shutdown(callback){
    exec('shutdown now', function(error, stdout, stderr){ callback(stdout); });
}
// Create reboot function
function reboot(callback){
    exec('shutdown -r now', function(error, stdout, stderr){ callback(stdout); });
}


const run = (c) => {
    client.readDiscreteInputs(0, 8)
        .then(data => {
            const date = new Date().toISOString();

            let avail = 'UNAVAILABLE';
            if (data.data[0]) {
                avail = 'AVAILABLE'
            }

            let job = 'IDLE';
            if (data.data[1]) {
                job = 'RUNNING'
            }

            let fault = 'NORMAL';
            if (data.data[2]) {
                fault = 'FAULT'
            }
            if (data.data[3]) {
                // Shutdown computer
                shutdown(function(output){
                    console.log(output);
                });
            }

            const unit = process.env.UNITID.toLowerCase();
            const str_data = `${date}|${unit}_avail|${avail}|${unit}_job|${job}|${unit}_fault|${fault}\n`;
            console.log(str_data);
            c.write(str_data)

        })
        .catch(error => {
            console.log(error.message)
        })

    //web server for job start emulation
    app.get('/:relay/:action', async (req, res) => {
        const relay = req.params.relay;
        const action = req.params.action === 'on';

        try {
            client.writeCoil(relay, action)
                .then(data => {
                    console.log('write', data)
                })
                .catch(error => {
                    console.log('write_error', error.message)
                });
            res.status(201).send('relay switched')
        } catch (error) {
            res.status(400).send(error.message)
        }
    });

    app.get('/reboot', async (req, res) => {
        try {
            // Reboot computer
            reboot(function(output){
                console.log(output);
                res.status(201).send(output)
            });
        } catch (error) {
            res.status(400).send(error.message)
        }

    });
}

//server for write in socket MTConnect agent
const server = net.createServer(function (c) { //'connection' listener
    console.log('server connected');
        setInterval(() => run(c), 1000);

        c.on('end', function () {
            console.log('server disconnected');
        });

        c.on('data', (data) => {
            const str = data.toString('utf8').trim();
            console.log('data:', str)
            if (str === '* PING') {
                console.log('pong')
                c.write('* PONG 10000');
            }
        });

        c.pipe(c);
});

client.connectRTU(process.env.COM, {baudRate: 9600}, () => {
    console.log('COM7 connected')
});

server.listen(7878, function () { //'listening' listener
    console.log('server bound');
});

app.listen(3999, () => {
    console.log('Web Server for MTC adapter started...');
});