const fs = require('fs');
const readline = require('readline');
const _ = require('lodash');

const CHUNK_SIZE = 500 * 1024 * 1024;
const INPUT_FILE = './largefile.txt';
const OUTPUT_FILE = './sortedfile.txt';

async function sortLargeFile() {
    const stats = fs.statSync(INPUT_FILE);
    const chunksCount = Math.ceil(stats.size / CHUNK_SIZE);

    let chunkFiles = [];

    for (let i = 0; i < chunksCount; i++) {
        const stream = fs.createReadStream(INPUT_FILE, {
            start: i * CHUNK_SIZE,
            end: Math.min(stats.size, (i + 1) * CHUNK_SIZE)
        });

        const lines = readline.createInterface({
            input: stream,
            crlfDelay: Infinity
        });

        let chunkData = [];
        for await (const line of lines) {
            chunkData.push(line);
        }

        chunkData.sort();

        let chunkFile = `./chunk${i}.txt`;
        fs.writeFileSync(chunkFile, chunkData.join('\n'));
        chunkFiles.push(chunkFile);

        chunkData = [];
    }

    let readStreams = chunkFiles.map(file => readline.createInterface({
        input: fs.createReadStream(file),
        crlfDelay: Infinity
    }));

    let values = await Promise.all(readStreams.map(lines => lines[Symbol.asyncIterator]().next()));
    let sortedStream = fs.createWriteStream(OUTPUT_FILE);
    while (values.some(v => !v.done)) {
        let minIndex = values.reduce((minIdx, currVal, currIdx) =>
            !currVal.done && (!minIdx || currVal.value < values[minIdx].value) ? currIdx : minIdx, null);

        sortedStream.write(values[minIndex].value + '\n');
        values[minIndex] = await readStreams[minIndex][Symbol.asyncIterator]().next();
    }

    sortedStream.end();

    chunkFiles.forEach(file => fs.unlinkSync(file));
}

sortLargeFile();
