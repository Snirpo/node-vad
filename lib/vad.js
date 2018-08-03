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

        if (typeof mode === 'number' &&
            mode >= VAD.Mode.MODE_NORMAL && mode <= VAD.Mode.MODE_VERY_AGGRESSIVE) {
            binding.vad_setmode(this._vad, mode);
        } else {
            throw new Error('Invalid mode settings')
        }
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
