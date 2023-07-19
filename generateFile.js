const fs = require('fs');
const path = require('path');

const FILE_SIZE = 1 * 1024 * 1024 * 1024;
const OUTPUT_FILE = path.resolve(__dirname, './largefile.txt');

function generateLargeFile() {
    let stream = fs.createWriteStream(OUTPUT_FILE, {flags: 'a'});
    let size = 0;

    function write() {
        let ok = true;
        do {
            let num = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
            let data = num + '\n';

            if (size >= FILE_SIZE) {
                stream.end();
            } else {
                size += Buffer.byteLength(data);
                ok = stream.write(data);
            }
        } while (size < FILE_SIZE && ok);

        if (size < FILE_SIZE) {
            stream.once('drain', write);
        }
    }

    write();
}

generateLargeFile();
