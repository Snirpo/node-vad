import {Transform} from "stream";

const binding = require('bindings')('vad');
const Buffer = require('buffer').Buffer;

class VAD {

    constructor(mode) {
        const size = binding.vad_alloc(null);
        if (size.error) {
            throw new Error('Failed to get VAD size')
        }

        this._vad = Buffer.alloc(size.size);
        if (!binding.vad_alloc(this._vad)) {
            throw new Error('Failed to allocate VAD')
        }

        if (!binding.vad_init(this._vad)) {
            throw new Error('Failed to initialise VAD')
        }

        if (!(typeof mode === 'number' && mode >= VAD.Mode.MODE_NORMAL && mode <= VAD.Mode.MODE_VERY_AGGRESSIVE)) {
            throw new Error('Invalid mode settings')
        }

        binding.vad_setmode(this._vad, mode);
    }

    createStream(opts) {
        return new VADStream(this, opts);
    }

    // expects 16 bit signed audio
    processAudio(buffer, rate, callback) {
        binding.vad_processAudio(this._vad, VAD.toFloatBuffer(buffer), rate, callback);
    }

    processAudioFloat(buffer, rate, callback) {
        binding.vad_processAudio(this._vad, buffer, rate, callback);
    }

    // TODO: Not very efficient...
    static toFloatBuffer(buffer) {
        const floatData = Buffer.alloc(buffer.length * 2);
        for (let i = 0; i < buffer.length; i += 2) {
            const intVal = buffer.readInt16LE(i);
            const floatVal = intVal / 32768.0;
            floatData.writeFloatLE(floatVal, i * 2);
        }
        return floatData;
    }
}

class VADStream extends Transform {
    vad = null;
    audioFrequency = 16000;
    debounceTime = 1000;

    inSpeech = false;
    startTime = 0;
    endTime = 0;
    lastSpeech = 0;

    buffer = null;

    constructor(vad, opts = {}) {
        super({
            ...opts,
            writableObjectMode: false,
            readableObjectMode: true,
        });
        this.vad = vad;

        if (typeof opts.audioFrequency === 'number') {
            if (opts.audioFrequency < 4000 || opts.audioFrequency > 32000) {
                throw new Error("audioFrequency must be >= 8000 and <= 32000");
            }
            this.audioFrequency = opts.audioFrequency;
        }

        if (typeof opts.debounceTime === 'number') {
            if (opts.debounceTime < 0) {
                throw new Error("debounceTime must be greater than 0");
            }
            this.debounceTime = opts.debounceTime;
        }

        this.buffer = Buffer.alloc(64 / ((1000 / this.audioFrequency) / 2));
    }

    _transform(chunk, encoding, callback) {
        this.vad.processAudio(chunk.audioData, this.audioFrequency, (err, event) => {
            if (event === VAD.Event.EVENT_ERROR) {
                return callback("Error in VAD");
            }

            let start = false;

            if (this.inSpeech && (chunk.time - this.lastSpeech > this.debounceTime)) {
                this.inSpeech = false;
                this.endTime = chunk.time;
            }

            if (event === VAD.Event.EVENT_VOICE) {
                // Speech
                if (!this.inSpeech) {
                    this.inSpeech = true;
                    this.startTime = chunk.time;
                    start = true;
                }

                this.lastSpeech = chunk.time;
            }

            if (this.inSpeech) {
                return callback(null, {
                    time: chunk.time,
                    audioData: chunk.audioData,
                    speech: {
                        start: start,
                        startTime: this.startTime,
                        endTime: this.endTime
                    }
                });
            }

            return callback();
        });
    }

    _fillBuffer(chunk) {
        if (chunk > this.buffer.length) {
            return this.buffer.fill(chunk);
        }
        this.buffer.fill(chunk);
    }
}

VAD.Event = Object.freeze({
    EVENT_ERROR: -1,
    EVENT_SILENCE: 0,
    EVENT_VOICE: 1,
    EVENT_NOISE: 2
});

VAD.Mode = Object.freeze({
    MODE_NORMAL: 0,
    MODE_LOW_BITRATE: 1,
    MODE_AGGRESSIVE: 2,
    MODE_VERY_AGGRESSIVE: 3
});

module.exports = VAD;
