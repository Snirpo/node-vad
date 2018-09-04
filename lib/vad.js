const {Transform} = require('stream');
const {Buffer} = require('buffer');
const binding = require('bindings')('vad');

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

    constructor(vad, opts = {}) {
        super({
            ...opts,
            writableObjectMode: false,
            readableObjectMode: true,
        });
        this.vad = vad;

        if (typeof opts.audioFrequency === 'number' && !(opts.audioFrequency === 8000 ||
            opts.audioFrequency === 16000 ||
            opts.audioFrequency === 32000 ||
            opts.audioFrequency === 48000)) {
            throw new Error("audioFrequency must be 8000, 16000, 32000 or 48000");
        }
        this.audioFrequency = opts.audioFrequency || 16000;

        if (typeof opts.debounceTime === 'number' && opts.debounceTime < 0) {
            throw new Error("debounceTime must be greater than 0");
        }
        this.debounceTime = opts.debounceTime || 1000;

        this.timeMultiplier = (1000 / this.audioFrequency) / 2;
        this.byteCount = 0;
        this.inSpeech = false;
        this.startTime = 0;
        this.lastSpeech = 0;
    }

    _transform(chunk, encoding, callback) {
        this._processAudio(chunk, callback);
    }

    _processAudio(chunk, callback) {
        const time = this.timeMultiplier * this.byteCount;
        this.byteCount += chunk.length;

        this.vad.processAudio(chunk, this.audioFrequency, (err, event) => {
            if (err) {
                return callback(err);
            }

            if (event === VAD.Event.EVENT_ERROR) {
                return callback("Error in VAD");
            }

            let start = false;

            if (this.inSpeech && (time - this.lastSpeech > this.debounceTime)) {
                this.inSpeech = false;
            }

            if (event === VAD.Event.EVENT_VOICE) {
                // Speech
                if (!this.inSpeech) {
                    this.inSpeech = true;
                    this.startTime = time;
                    start = true;
                }

                this.lastSpeech = time;
            }

            if (this.inSpeech) {
                return callback(null, {
                    time: time,
                    audioData: chunk,
                    speech: {
                        start: start,
                        startTime: this.startTime
                    }
                });
            }

            return callback();
        });
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
