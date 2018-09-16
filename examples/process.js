const VAD = require("../index.js");
const fs = require("fs");

const vad = new VAD(VAD.Mode.NORMAL);

const stream = fs.createReadStream("demo_pcm_s16_16000.raw");
stream.on("data", chunk => {
    vad.processAudio(chunk, 16000).then(res => {
        switch (res) {
            case VAD.Event.ERROR:
                console.log("ERROR");
                break;
            case VAD.Event.NOISE:
                console.log("NOISE");
                break;
            case VAD.Event.SILENCE:
                console.log("SILENCE");
                break;
            case VAD.Event.VOICE:
                console.log("VOICE");
                break;
        }
    }).catch(console.error);
});