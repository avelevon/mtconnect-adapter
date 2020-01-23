const net = require('net');
const fs = require('fs');
const es = require('event-stream');



const server = net.createServer(function (c) { //'connection' listener
    console.log('server connected');

    let lines = [];

    let s = fs.createReadStream('text.txt')
        .pipe(es.split())
        .pipe(es.mapSync(function (line) {
                //pause the readstream
                s.pause();
                lines.push(line);
                s.resume();
            })
                .on('error', function (err) {
                    console.log('Error:', err);
                })
                .on('end', function () {
                    console.log('Finish file reading.');
                    let index = 0;
                    setInterval(() => {

                        // const str = lines[index++].replace(/\d{4}-\d{2}-\d{2}T\d{2}\:\d{2}\:\d{2}\.\d{6}/, '');
                        const str = lines[index++] + '\n';
                        console.log(str)
                        c.write(str)
                    }, 10)
                })
        );

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
server.listen(7878, function () { //'listening' listener
    console.log('server bound');

});