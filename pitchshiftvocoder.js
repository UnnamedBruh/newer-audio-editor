// Imported from https://github.com/indutny/fft.js/blob/master/lib/fft.js, LICENSED IN MIT LICENSE

"use strict";function FFT(t){if(this.size=0|t,this.size<=1||0!=(this.size&this.size-1))throw new Error("FFT size must be a power of two and bigger than 1");this._csize=t<<1;for(var r=new Array(2*this.size),i=0;i<r.length;i+=2){const t=Math.PI*i/this.size;r[i]=Math.cos(t),r[i+1]=-Math.sin(t)}this.table=r;for(var s=0,o=1;this.size>o;o<<=1)s++;this._width=s%2==0?s-1:s,this._bitrev=new Array(1<<this._width);for(var n=0;n<this._bitrev.length;n++){this._bitrev[n]=0;for(var e=0;e<this._width;e+=2){var h=this._width-e-2;this._bitrev[n]|=(n>>>e&3)<<h}}this._out=null,this._data=null,this._inv=0}FFT.prototype.fromComplexArray=function(t,r){for(var i=r||new Array(t.length>>>1),s=0;s<t.length;s+=2)i[s>>>1]=t[s];return i},FFT.prototype.createComplexArray=function(){const t=new Array(this._csize);for(var r=0;r<t.length;r++)t[r]=0;return t},FFT.prototype.toComplexArray=function(t,r){for(var i=r||this.createComplexArray(),s=0;s<i.length;s+=2)i[s]=t[s>>>1],i[s+1]=0;return i},FFT.prototype.completeSpectrum=function(t){for(var r=this._csize,i=r>>>1,s=2;s<i;s+=2)t[r-s]=t[s],t[r-s+1]=-t[s+1]},FFT.prototype.transform=function(t,r){if(t===r)throw new Error("Input and output buffers must be different");this._out=t,this._data=r,this._inv=0,this._transform4(),this._out=null,this._data=null},FFT.prototype.realTransform=function(t,r){if(t===r)throw new Error("Input and output buffers must be different");this._out=t,this._data=r,this._inv=0,this._realTransform4(),this._out=null,this._data=null},FFT.prototype.inverseTransform=function(t,r){if(t===r)throw new Error("Input and output buffers must be different");this._out=t,this._data=r,this._inv=1,this._transform4();for(var i=0;i<t.length;i++)t[i]/=this.size;this._out=null,this._data=null},FFT.prototype._transform4=function(){var t,r,i=this._out,s=this._csize,o=1<<this._width,n=s/o<<1,e=this._bitrev;if(4===n)for(t=0,r=0;t<s;t+=n,r++){const i=e[r];this._singleTransform2(t,i,o)}else for(t=0,r=0;t<s;t+=n,r++){const i=e[r];this._singleTransform4(t,i,o)}var h=this._inv?-1:1,a=this.table;for(o>>=2;o>=2;o>>=2){var f=(n=s/o<<1)>>>2;for(t=0;t<s;t+=n)for(var _=t+f,u=t,l=0;u<_;u+=2,l+=o){const t=u,r=t+f,s=r+f,o=s+f,n=i[t],e=i[t+1],_=i[r],p=i[r+1],c=i[s],v=i[s+1],F=i[o],m=i[o+1],T=n,d=e,y=a[l],w=h*a[l+1],b=_*y-p*w,g=_*w+p*y,z=a[2*l],A=h*a[2*l+1],x=c*z-v*A,C=c*A+v*z,E=a[3*l],I=h*a[3*l+1],R=F*E-m*I,M=F*I+m*E,P=T+x,S=d+C,j=T-x,k=d-C,q=b+R,B=g+M,D=h*(b-R),G=h*(g-M),H=P+q,J=S+B,K=P-q,L=S-B,N=j+G,O=k-D,Q=j-G,U=k+D;i[t]=H,i[t+1]=J,i[r]=N,i[r+1]=O,i[s]=K,i[s+1]=L,i[o]=Q,i[o+1]=U}}},FFT.prototype._singleTransform2=function(t,r,i){const s=this._out,o=this._data,n=o[r],e=o[r+1],h=o[r+i],a=o[r+i+1],f=n+h,_=e+a,u=n-h,l=e-a;s[t]=f,s[t+1]=_,s[t+2]=u,s[t+3]=l},FFT.prototype._singleTransform4=function(t,r,i){const s=this._out,o=this._data,n=this._inv?-1:1,e=2*i,h=3*i,a=o[r],f=o[r+1],_=o[r+i],u=o[r+i+1],l=o[r+e],p=o[r+e+1],c=o[r+h],v=o[r+h+1],F=a+l,m=f+p,T=a-l,d=f-p,y=_+c,w=u+v,b=n*(_-c),g=n*(u-v),z=F+y,A=m+w,x=T+g,C=d-b,E=F-y,I=m-w,R=T-g,M=d+b;s[t]=z,s[t+1]=A,s[t+2]=x,s[t+3]=C,s[t+4]=E,s[t+5]=I,s[t+6]=R,s[t+7]=M},FFT.prototype._realTransform4=function(){var t,r,i=this._out,s=this._csize,o=1<<this._width,n=s/o<<1,e=this._bitrev;if(4===n)for(t=0,r=0;t<s;t+=n,r++){const i=e[r];this._singleRealTransform2(t,i>>>1,o>>>1)}else for(t=0,r=0;t<s;t+=n,r++){const i=e[r];this._singleRealTransform4(t,i>>>1,o>>>1)}var h=this._inv?-1:1,a=this.table;for(o>>=2;o>=2;o>>=2){var f=(n=s/o<<1)>>>1,_=f>>>1,u=_>>>1;for(t=0;t<s;t+=n)for(var l=0,p=0;l<=u;l+=2,p+=o){var c=t+l,v=c+_,F=v+_,m=F+_,T=i[c],d=i[c+1],y=i[v],w=i[v+1],b=i[F],g=i[F+1],z=i[m],A=i[m+1],x=T,C=d,E=a[p],I=h*a[p+1],R=y*E-w*I,M=y*I+w*E,P=a[2*p],S=h*a[2*p+1],j=b*P-g*S,k=b*S+g*P,q=a[3*p],B=h*a[3*p+1],D=z*q-A*B,G=z*B+A*q,H=x+j,J=C+k,K=x-j,L=C-k,N=R+D,O=M+G,Q=h*(R-D),U=h*(M-G),V=H+N,W=J+O,X=K+U,Y=L-Q;if(i[c]=V,i[c+1]=W,i[v]=X,i[v+1]=Y,0!==l){if(l!==u){var Z=K+-h*U,$=-L+-h*Q,tt=H+-h*N,rt=-J- -h*O,it=t+_-l,st=t+f-l;i[it]=Z,i[it+1]=$,i[st]=tt,i[st+1]=rt}}else{var ot=H-N,nt=J-O;i[F]=ot,i[F+1]=nt}}}},FFT.prototype._singleRealTransform2=function(t,r,i){const s=this._out,o=this._data,n=o[r],e=o[r+i],h=n+e,a=n-e;s[t]=h,s[t+1]=0,s[t+2]=a,s[t+3]=0},FFT.prototype._singleRealTransform4=function(t,r,i){const s=this._out,o=this._data,n=this._inv?-1:1,e=2*i,h=3*i,a=o[r],f=o[r+i],_=o[r+e],u=o[r+h],l=a+_,p=a-_,c=f+u,v=n*(f-u),F=l+c,m=p,T=-v,d=l-c,y=p,w=v;s[t]=F,s[t+1]=0,s[t+2]=m,s[t+3]=T,s[t+4]=d,s[t+5]=0,s[t+6]=y,s[t+7]=w};

class PitchShifterProcessor extends AudioWorkletProcessor { // This module was written by GPT-5.3
  static get parameterDescriptors() {
    return [
      { name: "shift", defaultValue: 1.0, minValue: 0.01, maxValue: 20.0 }
    ];
  }

  constructor() {
    super();

    this.frameSize = 1024;
    this.hopSize = 128; // 87.5% overlap
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
      const sample = (this.time[2 * i] /*/ frameSize*/) * this.window[i];
      const idx = (this.readIndex + i) % frameSize;
      this.outputBuffer[idx] += sample;
    }
  }
}

registerProcessor("pitch-shifter", PitchShifterProcessor);

// Known-good Phase Vocoder Pitch Shifter (optimized for indutny/fft.js)
// Focus: correct scaling, stable phase locking, clean OLA reconstruction
// ALSO DONE BY GPT-5.3 MINI

class PitchShifterProcessorPolished extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: "shift",
        defaultValue: 1.0,
        minValue: 0.01,
        maxValue: 20.0,
        automationRate: "k-rate"
      }
    ];
  }

  constructor() {
    super();

    // -------- Core settings --------
    this.N = 1024;
    this.hop = this.N / 4; // Hann COLA-safe
    this.half = this.N >> 1;

    this.fft = new FFT(this.N);

    // -------- Buffers --------
    this.window = new Float32Array(this.N);
    this.input = new Float32Array(this.N);

    this.prevPhase = new Float32Array(this.half + 1);
    this.sumPhase = new Float32Array(this.half + 1);

    this.spectrum = this.fft.createComplexArray();
    this.synth = this.fft.createComplexArray();
    this.time = this.fft.createComplexArray();

    // Overlap-add buffer (must be larger than N)
    this.ola = new Float32Array(this.N * 2);
    this.olaPos = 0;

    this.writePos = 0;

    // -------- Hann window (COLA compatible with 4x overlap) --------
    for (let i = 0; i < this.N; i++) {
      this.window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / this.N));
    }

    this.twoPi = 2 * Math.PI;
    this.freqPerBin = (2 * Math.PI) / this.N;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0][0];
    const output = outputs[0][0];
    if (!input || !output) return true;

    const shiftArr = parameters.shift;

    for (let i = 0; i < input.length; i++) {
      const shift = shiftArr.length > 1 ? shiftArr[i] : shiftArr[0];

      // -------- Input buffer (circular) --------
      this.input[this.writePos] = input[i];
      this.writePos = (this.writePos + 1) % this.N;

      // -------- Frame trigger --------
      if (this.writePos % this.hop === 0) {
        this.processFrame(shift);
      }

      // -------- Output (latency inherent = N) --------
      output[i] = this.ola[this.olaPos] || 0;
      this.ola[this.olaPos] = 0;
      this.olaPos = (this.olaPos + 1) % this.ola.length;
    }

    return true;
  }

  processFrame(shift) {
    const N = this.N;
    const half = this.half;

    // -------- Analysis frame --------
    const frame = new Float32Array(N);

    // FIX: correct circular indexing (fft.js quirk-safe)
    for (let i = 0; i < N; i++) {
      const idx = (this.writePos - N + i + N) % N;
      frame[i] = this.input[idx] * this.window[i];
    }

    this.fft.realTransform(this.spectrum, frame);
    this.fft.completeSpectrum(this.spectrum);

    // -------- Analysis (magnitude + true frequency) --------
    for (let k = 0; k <= half; k++) {
      const re = this.spectrum[2 * k];
      const im = this.spectrum[2 * k + 1];

      const mag = Math.hypot(re, im);
      const phase = Math.atan2(im, re);

      const prev = this.prevPhase[k];
      this.prevPhase[k] = phase;

      let delta = phase - prev - this.freqPerBin * k * this.hop;
      delta -= this.twoPi * Math.round(delta / this.twoPi);

      this.analysisFreq = this.analysisFreq || new Float32Array(half + 1);
      this.analysisMag = this.analysisMag || new Float32Array(half + 1);

      this.analysisFreq[k] = this.freqPerBin * k + delta / this.hop;
      this.analysisMag[k] = mag;
    }

    // -------- Synthesis --------
    this.synth.fill(0);
    const norm = new Float32Array(N);

    for (let k = 0; k <= half; k++) {
      const mag = this.analysisMag[k];
      if (mag < 1e-8) continue;

      const target = k * shift;
      const i0 = target | 0;
      const frac = target - i0;

      if (i0 > half) continue;

      const freq = this.analysisFreq[k];
      const phaseInc = freq * this.hop;

      // -------- phase locking (minimal, stable) --------
      const phase = (this.sumPhase[i0] || 0) + phaseInc;
      this.sumPhase[i0] = phase;

      const bins = [i0, i0 + 1];
      const w = [1 - frac, frac];

      for (let b = 0; b < 2; b++) {
        const bin = bins[b];
        if (bin > half) continue;

        const weight = mag * w[b];

        this.synth[2 * bin] += weight * Math.cos(phase);
        this.synth[2 * bin + 1] += weight * Math.sin(phase);

        norm[bin] += w[b];
      }
    }

    // -------- normalize synthesis bins (important for fft.js stability) --------
    for (let k = 0; k <= half; k++) {
      if (norm[k] > 0) {
        this.synth[2 * k] /= norm[k];
        this.synth[2 * k + 1] /= norm[k];
      }
    }

    // -------- mirror spectrum --------
    for (let k = 1; k < half; k++) {
      this.synth[2 * (N - k)] = this.synth[2 * k];
      this.synth[2 * (N - k) + 1] = -this.synth[2 * k + 1];
    }

    // -------- IFFT (fft.js returns unnormalized signal) --------
    this.fft.inverseTransform(this.time, this.synth);

    // -------- Overlap-add (COLA-safe with Hann + 4x overlap) --------
    for (let i = 0; i < N; i++) {
      const sample = (this.time[2 * i]) * this.window[i];
      const idx = (this.olaPos + i) % this.ola.length;
      this.ola[idx] += sample;
    }
  }
}

registerProcessor("pitch-shifter-polished", PitchShifterProcessorPolished);

class PitchShifterStereoPolished extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{
      name: "shift",
      defaultValue: 1.0,
      minValue: 0.01,
      maxValue: 20.0,
      automationRate: "k-rate"
    }, {
      name: "perceptuallyaccurate",
      defaultValue: 1,
      minValue: 0,
      maxValue: 1,
      automationRate: "k-rate"
    }];
  }

  constructor() {
    super();

    this.N = 1024;
    this.hop = this.N / 4;
    this.half = this.N >> 1;

    this.fft = new FFT(this.N);

    this.window = new Float32Array(this.N);

    this.inputL = new Float32Array(this.N);
    this.inputR = new Float32Array(this.N);
    this.writePos = 0;

    // Mid phase state
    this.prevPhase = new Float32Array(this.half + 1);
    this.sumPhase  = new Float32Array(this.half + 1);

    // Side phase state
    this.prevPhaseSide = new Float32Array(this.half + 1);
    this.sumPhaseSide  = new Float32Array(this.half + 1);

    // Bug 5 fix: replace the two dead sumPhasePeak arrays with per-channel
    // synthFreq scratch buffers used by the basic (non-peak-locking) path.
    this.synthFreq     = new Float32Array(this.half + 1);
    this.synthFreqSide = new Float32Array(this.half + 1);

    this.spectrum = this.fft.createComplexArray();
    this.synth    = this.fft.createComplexArray();
    this.time     = this.fft.createComplexArray();

    this.olaL = new Float32Array(this.N * 2);
    this.olaR = new Float32Array(this.N * 2);

    this.olaReadPos  = 0;
    this.olaWritePos = 0;
    this.inputCount  = 0;

    this.freqPerBin = (2 * Math.PI) / this.N;
    this.twoPi      = 2 * Math.PI;

    for (let i = 0; i < this.N; i++) {
      this.window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / this.N));
    }
  }

  process(inputs, outputs, parameters) {
    const input  = inputs[0];
    const output = outputs[0];

    if (!input || !output || !input[0] || !input[1]) return true;

    const inL  = input[0];
    const inR  = input[1];
    const outL = output[0];
    const outR = output[1];

    const shiftArr = parameters.shift;
    const paArr    = parameters.perceptuallyaccurate;

    for (let i = 0; i < inL.length; i++) {
      const shift = shiftArr.length > 1 ? shiftArr[i] : shiftArr[0];
      const pa    = paArr.length    > 1 ? paArr[i]    : paArr[0];

      this.inputL[this.writePos] = inL[i];
      this.inputR[this.writePos] = inR[i];
      this.writePos = (this.writePos + 1) % this.N;

      this.inputCount++;
      if (this.inputCount % this.hop === 0) {
        this.processFrame(shift, pa);
      }

      const op   = this.olaReadPos;
      outL[i]    = this.olaL[op] || 0;
      outR[i]    = this.olaR[op] || 0;
      this.olaL[op] = 0;
      this.olaR[op] = 0;
      this.olaReadPos = (this.olaReadPos + 1) % this.olaL.length;
    }

    return true;
  }

  // Bug 6 fix: Hann at 4× overlap has a constant OLA gain of 1.5.
  // All output samples are divided by this constant so amplitude is preserved
  // regardless of how many frames overlap at any given point.
  static get OLA_NORM() { return 1.5; }

  processChannel(frame, prevPhase, sumPhase, synthFreqBuf, shift, perceptuallyAccurate) {
    const N    = this.N;
    const half = this.half;

    this.fft.realTransform(this.spectrum, frame);
    this.fft.completeSpectrum(this.spectrum);

    const analysisMag  = new Float32Array(half + 1);
    const analysisFreq = new Float32Array(half + 1);

    for (let k = 0; k <= half; k++) {
      const re = this.spectrum[2 * k];
      const im = this.spectrum[2 * k + 1];

      const mag   = Math.hypot(re, im);
      const phase = Math.atan2(im, re);

      const prev     = prevPhase[k];
      prevPhase[k]   = phase;

      let delta = phase - prev - this.freqPerBin * k * this.hop;
      delta    -= this.twoPi * Math.round(delta / this.twoPi);

      analysisFreq[k] = this.freqPerBin * k + delta / this.hop;
      analysisMag[k]  = mag;
    }

    this.synth.fill(0);
    const norm = new Float32Array(N);

    if (perceptuallyAccurate > 0.5) {
      // ── Peak-locking path ──────────────────────────────────────────────

      const peaks = this.findPeaks(analysisMag, half);

      // Map each SOURCE bin to its nearest source peak.
      const peakForSrcBin = new Int16Array(half + 1);
      for (let k = 0; k <= half; k++) {
        let bestPeak = 0, bestDist = Infinity;
        for (let p = 0; p < peaks.length; p++) {
          const d = Math.abs(k - peaks[p]);
          if (d < bestDist) { bestDist = d; bestPeak = peaks[p]; }
        }
        peakForSrcBin[k] = bestPeak;
      }

      // Bug 2 fix: accumulate phase at TARGET peak indices, not source.
      // The synthesis IFFT operates in target (shifted) frequency space, so
      // the phase accumulator must live there too.  The phase increment is
      // analysisFreq[pk] * shift * hop — the shifted instantaneous frequency
      // times the synthesis hop.
      for (let p = 0; p < peaks.length; p++) {
        const pk       = peaks[p];
        const targetPk = Math.min(Math.round(pk * shift), half);
        sumPhase[targetPk] += analysisFreq[pk] * shift * this.hop;
      }

      // Scatter bins into shifted positions.
      // Bug 4 fix: every bin (peak or not) derives its synthesis phase from
      // its owning peak's accumulator, which now lives in target space.
      for (let k = 0; k <= half; k++) {
        const mag = analysisMag[k];
        if (mag < 1e-8) continue;

        const target = k * shift;
        const i0     = target | 0;
        const frac   = target - i0;
        if (i0 > half) continue;

        // Resolve the owning peak to target space.
        const targetPeak = Math.min(Math.round(peakForSrcBin[k] * shift), half);
        const phase      = sumPhase[targetPeak];

        const bins = [i0, i0 + 1];
        const w    = [1 - frac, frac];

        for (let b = 0; b < 2; b++) {
          const bin = bins[b];
          if (bin > half) continue;
          const weight = mag * w[b];
          this.synth[2 * bin]     += weight * Math.cos(phase);
          this.synth[2 * bin + 1] += weight * Math.sin(phase);
          norm[bin] += w[b];
        }
      }

    } else {
      // ── Basic path ────────────────────────────────────────────────────

      // Bug 3 fix: instead of letting the last source bin that maps to a
      // given target bin "win", collect the weighted-average instantaneous
      // frequency for each target bin, then advance all phase accumulators
      // in a single pass.  This makes the phase evolution deterministic and
      // independent of scatter order.
      synthFreqBuf.fill(0);
      const synthNorm = new Float32Array(half + 1);

      for (let k = 0; k <= half; k++) {
        const mag = analysisMag[k];
        if (mag < 1e-8) continue;

        const target = k * shift;
        const i0     = target | 0;
        const frac   = target - i0;
        if (i0 > half) continue;

        const freq = analysisFreq[k];
        const bins = [i0, i0 + 1];
        const w    = [1 - frac, frac];

        for (let b = 0; b < 2; b++) {
          const bin = bins[b];
          if (bin > half) continue;
          synthFreqBuf[bin] += freq * shift * w[b];
          synthNorm[bin]    += w[b];
        }
      }

      // Advance phase accumulators once per target bin, then scatter.
      for (let k = 0; k <= half; k++) {
        if (synthNorm[k] > 0) {
          sumPhase[k] += (synthFreqBuf[k] / synthNorm[k]) * this.hop;
        }
      }

      for (let k = 0; k <= half; k++) {
        const mag = analysisMag[k];
        if (mag < 1e-8) continue;

        const target = k * shift;
        const i0     = target | 0;
        const frac   = target - i0;
        if (i0 > half) continue;

        const bins = [i0, i0 + 1];
        const w    = [1 - frac, frac];

        for (let b = 0; b < 2; b++) {
          const bin = bins[b];
          if (bin > half) continue;
          const weight = mag * w[b];
          this.synth[2 * bin]     += weight * Math.cos(sumPhase[bin]);
          this.synth[2 * bin + 1] += weight * Math.sin(sumPhase[bin]);
          norm[bin] += w[b];
        }
      }
    }

    for (let k = 0; k <= half; k++) {
      if (norm[k] > 0) {
        this.synth[2 * k]     /= norm[k];
        this.synth[2 * k + 1] /= norm[k];
      }
    }

    for (let k = 1; k < half; k++) {
      this.synth[2 * (N - k)]     =  this.synth[2 * k];
      this.synth[2 * (N - k) + 1] = -this.synth[2 * k + 1];
    }

    this.fft.inverseTransform(this.time, this.synth);

    return this.time.slice();
  }

  processFrame(shift, pa) {
    const N = this.N;

    const midFrame  = new Float32Array(N);
    const sideFrame = new Float32Array(N);

    // Bug 1 fix: capture writePos BEFORE advancing, then use writeBase for
    // all OLA writes below.  The original code advanced olaWritePos first,
    // making every frame land one hop later than intended.
    const writeBase  = this.olaWritePos;
    this.olaWritePos = (this.olaWritePos + this.hop) % this.olaL.length;

    for (let i = 0; i < N; i++) {
      const idx        = (this.writePos - N + i + N) % N;
      midFrame[i]  = 0.5 * (this.inputL[idx] + this.inputR[idx]) * this.window[i];
      sideFrame[i] = 0.5 * (this.inputL[idx] - this.inputR[idx]) * this.window[i];
    }

    const midTime  = this.processChannel(
      midFrame,  this.prevPhase,     this.sumPhase,     this.synthFreq,     shift, pa);
    const sideTime = this.processChannel(
      sideFrame, this.prevPhaseSide, this.sumPhaseSide,  this.synthFreqSide, shift, pa);

    // Bug 6 fix: divide by the Hann/4× OLA normalisation constant so that
    // the overlapping windowed frames sum to unity gain.
    const olaNorm = PitchShifterStereoPolished.OLA_NORM;

    for (let i = 0; i < N; i++) {
      const m = (midTime[2 * i]  * this.window[i]) / olaNorm;
      const s = (sideTime[2 * i] * this.window[i]) / olaNorm;

      // Bug 1 fix: write at writeBase + i, not the already-advanced olaWritePos.
      const idx = (writeBase + i) % this.olaL.length;

      this.olaL[idx] += m + s;
      this.olaR[idx] += m - s;
    }
  }

  findPeaks(mag, half) {
    const peaks = [];
    for (let k = 1; k < half - 1; k++) {
      if (mag[k] > mag[k - 1] && mag[k] > mag[k + 1]) {
        peaks.push(k);
      }
    }
    return peaks;
  }
}

registerProcessor("pitch-shifter-polishedstereo", PitchShifterStereoPolished);
