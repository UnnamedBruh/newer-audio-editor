class PitchShifterProcessor extends AudioWorkletProcessor { // This module was written by GPT-5.3
  static get parameterDescriptors() {
    return [
      { name: "shift", defaultValue: 1.0, minValue: 0.01, maxValue: 20.0 }
    ];
  }

  constructor() {
    super();

    this.frameSize = 512;
    this.hopSize = 128; // 75% overlap
    this.half = this.frameSize / 2;

    this.fft = new FFT(this.frameSize);

    // Buffers
    this.inputBuffer = new Float32Array(this.frameSize);
    this.outputBuffer = new Float32Array(this.frameSize);
    this.window = new Float32Array(this.frameSize);

    // Phase
    this.prevPhase = new Float32Array(this.half + 1);
    this.sumPhase = new Float32Array(this.half + 1);

    // FFT buffers
    this.spectrum = this.fft.createComplexArray();
    this.outSpectrum = this.fft.createComplexArray();
    this.time = this.fft.createComplexArray();

    // Hann window
    for (let i = 0; i < this.frameSize; i++) {
      this.window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / this.frameSize));
    }

    this.writeIndex = 0;
    this.readIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0][0];
    const output = outputs[0][0];
    if (!input || !output) return true;

    const shiftValues = parameters.shift;

    for (let i = 0; i < input.length; i++) {
      const shift = shiftValues.length > 1 ? shiftValues[i] : shiftValues[0];

      // --- Push input into circular buffer ---
      this.inputBuffer[this.writeIndex] = input[i];
      this.writeIndex = (this.writeIndex + 1) % this.frameSize;

      // --- When enough samples, process a frame ---
      if (this.writeIndex % this.hopSize === 0) {
        this.processFrame(shift);
      }

      // --- Output ---
      output[i] = this.outputBuffer[this.readIndex] || 0;
      this.outputBuffer[this.readIndex] = 0;

      this.readIndex = (this.readIndex + 1) % this.frameSize;
    }

    return true;
  }

  processFrame(shift) {
    const { frameSize, hopSize, half } = this;

    // --- Windowed frame ---
    const frame = new Float32Array(frameSize);
    for (let i = 0; i < frameSize; i++) {
      const idx = (this.writeIndex + i) % frameSize;
      frame[i] = this.inputBuffer[idx] * this.window[i];
    }

    // --- FFT ---
    this.fft.realTransform(this.spectrum, frame);
    this.fft.completeSpectrum(this.spectrum);

    this.outSpectrum.fill(0);

    const freqPerBin = 2 * Math.PI / frameSize;

    for (let k = 0; k <= half; k++) {
      const re = this.spectrum[2 * k];
      const im = this.spectrum[2 * k + 1];

      const mag = Math.hypot(re, im);
      if (mag < 1e-6) continue;

      const phase = Math.atan2(im, re);

      let delta = phase - this.prevPhase[k];
      this.prevPhase[k] = phase;

      const expected = freqPerBin * k * hopSize;
      delta -= expected;
      delta -= 2 * Math.PI * Math.round(delta / (2 * Math.PI));

      const trueFreq = freqPerBin * k + delta / hopSize;

      const newBin = k * shift;
      if (newBin <= half) {
        const i0 = Math.floor(newBin);
        const frac = newBin - i0;

        const phaseAdvance = trueFreq * hopSize * shift;

        this.sumPhase[i0] += phaseAdvance;

        const mag0 = mag * (1 - frac);
        this.outSpectrum[2 * i0] += mag0 * Math.cos(this.sumPhase[i0]);
        this.outSpectrum[2 * i0 + 1] += mag0 * Math.sin(this.sumPhase[i0]);

        if (i0 + 1 <= half) {
          this.sumPhase[i0 + 1] += phaseAdvance;

          const mag1 = mag * frac;
          this.outSpectrum[2 * (i0 + 1)] += mag1 * Math.cos(this.sumPhase[i0 + 1]);
          this.outSpectrum[2 * (i0 + 1) + 1] += mag1 * Math.sin(this.sumPhase[i0 + 1]);
        }
      }
    }

    // Mirror spectrum
    for (let k = 1; k < half; k++) {
      this.outSpectrum[2 * (frameSize - k)] = this.outSpectrum[2 * k];
      this.outSpectrum[2 * (frameSize - k) + 1] = -this.outSpectrum[2 * k + 1];
    }

    // --- IFFT ---
    this.fft.inverseTransform(this.time, this.outSpectrum);

    // --- Overlap-add into output buffer ---
    for (let i = 0; i < frameSize; i++) {
      const sample = (this.time[2 * i] / frameSize) * this.window[i];
      const idx = (this.readIndex + i) % frameSize;
      this.outputBuffer[idx] += sample;
    }
  }
}

registerProcessor("pitch-shifter", PitchShifterProcessor);
