# node-vad

This is a stripped down version of this library (https://github.com/voixen/voixen-vad). Thank you very much!

WebRTC-based Voice Activity Detection library

Voice Activity Detection based on the method used in the upcoming [WebRTC](http://http://www.webrtc.org) HTML5 standard.
Extracted from [Chromium](https://chromium.googlesource.com/external/webrtc/+/branch-heads/43/webrtc/common_audio/vad/) for
stand-alone use as a library.

Supported sample rates are:
- 8000Hz
- 16000Hz*
- 32000Hz
- 48000Hz

*recommended sample rate for best performance/accuracy tradeoff

## Installation

## API

#### new VAD(mode)

Create a new `VAD` object using the given mode.

#### .processAudio(samples, samplerate, callback)

Analyse the given samples (`Buffer` object containing 16bit signed values) and notify the detected voice
event via `callback` and event.

#### .processAudioFloat(samples, samplerate, callback)

Analyse the given samples (`Buffer` object containing 32bit normalized float values) and notify the detected voice
event via `callback` and event.

### Event codes

Event codes are passed to the `processAudio` callback and to event handlers subscribed to the general
'event'-event.

#### VAD.Event.EVENT_ERROR

Constant for voice detection errors. Passed to 'error' event handlers.

#### VAD.Event.EVENT_SILENCE

Constant for voice detection results with no detected voices.
Passed to 'silence' event handlers.

#### VAD.Event.EVENT_VOICE

Constant for voice detection results with detected voice.
Passed to 'voice' event handlers.

#### VAD.Event.EVENT_NOISE

Constant for voice detection results with detected noise.
Not implemented yet

### Available VAD Modes

These contants can be used as the `mode` parameter of the `VAD` constructor to
configure the VAD algorithm. 

#### VAD.Mode.MODE_NORMAL

Constant for normal voice detection mode. Suitable for high bitrate, low-noise data.
May classify noise as voice, too. The default value if `mode` is omitted in the constructor.

#### VAD.Mode.MODE_LOW_BITRATE

Detection mode optimised for low-bitrate audio.

#### VAD.Mode.MODE_AGGRESSIVE

Detection mode best suited for somewhat noisy, lower quality audio.

#### VAD.Mode.MODE_VERY_AGGRESSIVE

Detection mode with lowest miss-rate. Works well for most inputs.

## Notes

The library is designed to work with input streams in mind, that is, sample buffers fed to `processAudio` should be
rather short (36ms to 144ms - depending on your needs) and the sample rate no higher than 32kHz. Sample rates higher than
than 16kHz provide no benefit to the VAD algorithm, as human voice patterns center around 4000 to 6000Hz. Minding the
Nyquist-frequency yields sample rates between 8000 and 12000Hz for best results.

## Example

See examples folder for a working example with a sample audio file.

```javascript
const VAD = require('VAD');
const fs = require('fs');

const vad = new VAD(VAD.Mode.MODE_NORMAL);

const stream = fs.createReadStream("demo_pcm_s16_16000.raw");
stream.on("data", chunk => {
    vad.processAudio(chunk, 16000, (err, res) => {
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
```

## License

[MIT](LICENSE)
