const VAD = require('../index.js');
const fs = require('fs');

const vad = new VAD(VAD.Mode.MODE_NORMAL);

const stream = fs.createReadStream("demo_pcm_s16_16000.raw");
stream.on("data", chunk => {
    vad.processAudio(chunk, 16000).then((res, err) => {
        switch (res) {
            case VAD.Event.EVENT_ERROR:
                console.log("EVENT_ERROR");
                break;
            case VAD.Event.EVENT_NOISE:
                console.log("EVENT_NOISE");
                break;
            case VAD.Event.EVENT_SILENCE:
                console.log("EVENT_SILENCE");
                break;
            case VAD.Event.EVENT_VOICE:
                console.log("EVENT_VOICE");
                break;
        }
    })
});