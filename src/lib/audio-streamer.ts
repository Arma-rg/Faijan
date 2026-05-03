/**
 * Handles audio recording (16kHz PCM) and playback (24kHz PCM).
 */
export class AudioStreamer {
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private stream: MediaStream | null = null;

  async startRecording(onAudioData: (base64Data: string) => void) {
    this.audioContext = new AudioContext({ sampleRate: 16000 });
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = this.audioContext.createMediaStreamSource(this.stream);
    
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      // Convert Float32 to Int16
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
      }
      const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
      onAudioData(base64);
    };
  }

  stopRecording() {
    this.processor?.disconnect();
    this.stream?.getTracks().forEach(track => track.stop());
    this.audioContext?.close();
    this.processor = null;
    this.stream = null;
    this.audioContext = null;
  }

  private playbackContext: AudioContext | null = null;
  private nextStartTime = 0;

  playChunk(base64Data: string) {
    if (!this.playbackContext) {
      this.playbackContext = new AudioContext({ sampleRate: 24000 });
      this.nextStartTime = this.playbackContext.currentTime;
    }

    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 0x7FFF;
    }

    const buffer = this.playbackContext.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    const source = this.playbackContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.playbackContext.destination);

    const startTime = Math.max(this.nextStartTime, this.playbackContext.currentTime);
    source.start(startTime);
    this.nextStartTime = startTime + buffer.duration;
  }

  stopPlayback() {
    this.playbackContext?.close();
    this.playbackContext = null;
    this.nextStartTime = 0;
  }
}
