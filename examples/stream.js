const VAD = require('../index.js');
const fs = require('fs');

const vad = new VAD(VAD.Mode.MODE_NORMAL);

const inputStream = fs.createReadStream("demo_pcm_s16_16000.raw");
const vadStream = vad.createStream({
    audioFrequency: 16000,
    debounceTime: 1000
});

inputStream.pipe(vadStream).on("data", console.log);