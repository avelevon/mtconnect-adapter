#!/usr/bin/env node

const net = require('net');
const fs = require('fs');
const es = require('event-stream');

let error = false;

const server = net.createServer();

let intervalId;

server.on('connection', (c) => {
    console.log('server connected');

    intervalId = setInterval(() => {
        const data = 'SI809_avail|AVAILABLE|SI809_job|RUNNING|SI809_fault|NORMAL';
        const date = new Date().toISOString();
            const str = date + '|' + data.toLowerCase() + '\n';
            if (!error) {
                console.log(str);
                c.write(str)
            }

    }, 1000)

    c.on('end', function () {
        console.log('server disconnected');
    });

    c.on('error', (err) => {
        console.log('connection err', err)
        error = true;
        server.close();
        clearInterval(intervalId);
        setTimeout(() => {
            server.listen(7878, function (err) { //'listening' listener
                if (err) {
                    console.log(err)
                }
                console.log('server bound');
            });
        }, 2000)
    });

    c.on('data', (data) => {
        const str = data.toString('utf8').trim();
        console.log('data:', str)
        error = false;
        if (str === '* PING') {
            console.log('pong')
            c.write('* PONG 10000');
        }
    });

    c.pipe(c);
})

server.on('end', () => {
    console.log('server end')
})

server.on('error', (err) => {
    console.log('server err', err);
});

server.listen(7878, function (err) { //'listening' listener
    if (err) {
        console.log(err)
    }
    console.log('server bound');
});
