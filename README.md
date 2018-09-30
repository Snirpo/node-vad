# node-vad

This is a stripped down version of this library (https://github.com/voixen/voixen-vad). Thank you very much!

Voice Activity Detection library

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

#### .processAudio(samples, samplerate)

Analyse the given samples (`Buffer` object containing 16bit signed values) and notify the detected voice
event via promise.

#### .processAudioFloat(samples, samplerate)

Analyse the given samples (`Buffer` object containing 32bit normalized float values) and notify the detected voice
event via promise.

#### static .createStream(options)

Create an stream for voice activation detection.

##### Options

```javascript
{
    mode: VAD.Mode.NORMAL, // VAD mode, see above
    audioFrequency: 16000, // Audiofrequency, see above
    debounceTime: 1000 // Time for debouncing speech active state, default 1 second
}
```

##### Stream output example:
```javascript
{ 
    time: 14520, // Current seek time in audio
    audioData: <Buffer>, // Original audio data
    speech: { 
        state: true, // Current state of speech
        start: false, // True on chunk when speech starts
        end: false, // True on chunk when speech ends
        startTime: 12360, // Time when speech started
        duration: 2160 // Duration of current speech block
    } 
}
```

### Event codes

Event codes are passed to the `processAudio` promises.

#### VAD.Event.ERROR

Constant for voice detection errors.

#### VAD.Event.SILENCE

Constant for voice detection results with no detected voices.

#### VAD.Event.VOICE

Constant for voice detection results with detected voice.

#### VAD.Event.NOISE

Constant for voice detection results with detected noise.
Not implemented yet

### Available VAD Modes

These contants can be used as the `mode` parameter of the `VAD` constructor to
configure the VAD algorithm. 

#### VAD.Mode.NORMAL

Constant for normal voice detection mode. Suitable for high bitrate, low-noise data.
May classify noise as voice, too. The default value if `mode` is omitted in the constructor.

#### VAD.Mode.LOW_BITRATE

Detection mode optimised for low-bitrate audio.

#### VAD.Mode.AGGRESSIVE

Detection mode best suited for somewhat noisy, lower quality audio.

#### VAD.Mode.VERY_AGGRESSIVE

Detection mode with lowest miss-rate. Works well for most inputs.

## Notes

The library is designed to work with input streams in mind, that is, sample buffers fed to `processAudio` should be
rather short (36ms to 144ms - depending on your needs) and the sample rate no higher than 32kHz. Sample rates higher than
than 16kHz provide no benefit to the VAD algorithm, as human voice patterns center around 4000 to 6000Hz. Minding the
Nyquist-frequency yields sample rates between 8000 and 12000Hz for best results.

## Example

See examples folder for a working examples with a sample audio file.

### Non-stream example:
```javascript
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
```

### Stream example:
```javascript
const inputStream = fs.createReadStream("demo_pcm_s16_16000.raw");
const vadStream = VAD.createStream({
    mode: VAD.Mode.NORMAL,
    audioFrequency: 16000,
    debounceTime: 1000
});

inputStream.pipe(vadStream).on("data", console.log);
```

## License

[MIT](LICENSE)
