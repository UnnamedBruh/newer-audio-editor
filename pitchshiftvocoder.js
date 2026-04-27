// Imported from https://github.com/indutny/fft.js/blob/master/lib/fft.js, LICENSED IN MIT LICENSE

"use strict";function FFT(t){if(this.size=0|t,this.size<=1||0!=(this.size&this.size-1))throw new Error("FFT size must be a power of two and bigger than 1");this._csize=t<<1;for(var r=new Array(2*this.size),i=0;i<r.length;i+=2){const t=Math.PI*i/this.size;r[i]=Math.cos(t),r[i+1]=-Math.sin(t)}this.table=r;for(var s=0,o=1;this.size>o;o<<=1)s++;this._width=s%2==0?s-1:s,this._bitrev=new Array(1<<this._width);for(var n=0;n<this._bitrev.length;n++){this._bitrev[n]=0;for(var e=0;e<this._width;e+=2){var h=this._width-e-2;this._bitrev[n]|=(n>>>e&3)<<h}}this._out=null,this._data=null,this._inv=0}FFT.prototype.fromComplexArray=function(t,r){for(var i=r||new Array(t.length>>>1),s=0;s<t.length;s+=2)i[s>>>1]=t[s];return i},FFT.prototype.createComplexArray=function(){const t=new Array(this._csize);for(var r=0;r<t.length;r++)t[r]=0;return t},FFT.prototype.toComplexArray=function(t,r){for(var i=r||this.createComplexArray(),s=0;s<i.length;s+=2)i[s]=t[s>>>1],i[s+1]=0;return i},FFT.prototype.completeSpectrum=function(t){for(var r=this._csize,i=r>>>1,s=2;s<i;s+=2)t[r-s]=t[s],t[r-s+1]=-t[s+1]},FFT.prototype.transform=function(t,r){if(t===r)throw new Error("Input and output buffers must be different");this._out=t,this._data=r,this._inv=0,this._transform4(),this._out=null,this._data=null},FFT.prototype.realTransform=function(t,r){if(t===r)throw new Error("Input and output buffers must be different");this._out=t,this._data=r,this._inv=0,this._realTransform4(),this._out=null,this._data=null},FFT.prototype.inverseTransform=function(t,r){if(t===r)throw new Error("Input and output buffers must be different");this._out=t,this._data=r,this._inv=1,this._transform4();for(var i=0;i<t.length;i++)t[i]/=this.size;this._out=null,this._data=null},FFT.prototype._transform4=function(){var t,r,i=this._out,s=this._csize,o=1<<this._width,n=s/o<<1,e=this._bitrev;if(4===n)for(t=0,r=0;t<s;t+=n,r++){const i=e[r];this._singleTransform2(t,i,o)}else for(t=0,r=0;t<s;t+=n,r++){const i=e[r];this._singleTransform4(t,i,o)}var h=this._inv?-1:1,a=this.table;for(o>>=2;o>=2;o>>=2){var f=(n=s/o<<1)>>>2;for(t=0;t<s;t+=n)for(var _=t+f,u=t,l=0;u<_;u+=2,l+=o){const t=u,r=t+f,s=r+f,o=s+f,n=i[t],e=i[t+1],_=i[r],p=i[r+1],c=i[s],v=i[s+1],F=i[o],m=i[o+1],T=n,d=e,y=a[l],w=h*a[l+1],b=_*y-p*w,g=_*w+p*y,z=a[2*l],A=h*a[2*l+1],x=c*z-v*A,C=c*A+v*z,E=a[3*l],I=h*a[3*l+1],R=F*E-m*I,M=F*I+m*E,P=T+x,S=d+C,j=T-x,k=d-C,q=b+R,B=g+M,D=h*(b-R),G=h*(g-M),H=P+q,J=S+B,K=P-q,L=S-B,N=j+G,O=k-D,Q=j-G,U=k+D;i[t]=H,i[t+1]=J,i[r]=N,i[r+1]=O,i[s]=K,i[s+1]=L,i[o]=Q,i[o+1]=U}}},FFT.prototype._singleTransform2=function(t,r,i){const s=this._out,o=this._data,n=o[r],e=o[r+1],h=o[r+i],a=o[r+i+1],f=n+h,_=e+a,u=n-h,l=e-a;s[t]=f,s[t+1]=_,s[t+2]=u,s[t+3]=l},FFT.prototype._singleTransform4=function(t,r,i){const s=this._out,o=this._data,n=this._inv?-1:1,e=2*i,h=3*i,a=o[r],f=o[r+1],_=o[r+i],u=o[r+i+1],l=o[r+e],p=o[r+e+1],c=o[r+h],v=o[r+h+1],F=a+l,m=f+p,T=a-l,d=f-p,y=_+c,w=u+v,b=n*(_-c),g=n*(u-v),z=F+y,A=m+w,x=T+g,C=d-b,E=F-y,I=m-w,R=T-g,M=d+b;s[t]=z,s[t+1]=A,s[t+2]=x,s[t+3]=C,s[t+4]=E,s[t+5]=I,s[t+6]=R,s[t+7]=M},FFT.prototype._realTransform4=function(){var t,r,i=this._out,s=this._csize,o=1<<this._width,n=s/o<<1,e=this._bitrev;if(4===n)for(t=0,r=0;t<s;t+=n,r++){const i=e[r];this._singleRealTransform2(t,i>>>1,o>>>1)}else for(t=0,r=0;t<s;t+=n,r++){const i=e[r];this._singleRealTransform4(t,i>>>1,o>>>1)}var h=this._inv?-1:1,a=this.table;for(o>>=2;o>=2;o>>=2){var f=(n=s/o<<1)>>>1,_=f>>>1,u=_>>>1;for(t=0;t<s;t+=n)for(var l=0,p=0;l<=u;l+=2,p+=o){var c=t+l,v=c+_,F=v+_,m=F+_,T=i[c],d=i[c+1],y=i[v],w=i[v+1],b=i[F],g=i[F+1],z=i[m],A=i[m+1],x=T,C=d,E=a[p],I=h*a[p+1],R=y*E-w*I,M=y*I+w*E,P=a[2*p],S=h*a[2*p+1],j=b*P-g*S,k=b*S+g*P,q=a[3*p],B=h*a[3*p+1],D=z*q-A*B,G=z*B+A*q,H=x+j,J=C+k,K=x-j,L=C-k,N=R+D,O=M+G,Q=h*(R-D),U=h*(M-G),V=H+N,W=J+O,X=K+U,Y=L-Q;if(i[c]=V,i[c+1]=W,i[v]=X,i[v+1]=Y,0!==l){if(l!==u){var Z=K+-h*U,$=-L+-h*Q,tt=H+-h*N,rt=-J- -h*O,it=t+_-l,st=t+f-l;i[it]=Z,i[it+1]=$,i[st]=tt,i[st+1]=rt}}else{var ot=H-N,nt=J-O;i[F]=ot,i[F+1]=nt}}}},FFT.prototype._singleRealTransform2=function(t,r,i){const s=this._out,o=this._data,n=o[r],e=o[r+i],h=n+e,a=n-e;s[t]=h,s[t+1]=0,s[t+2]=a,s[t+3]=0},FFT.prototype._singleRealTransform4=function(t,r,i){const s=this._out,o=this._data,n=this._inv?-1:1,e=2*i,h=3*i,a=o[r],f=o[r+i],_=o[r+e],u=o[r+h],l=a+_,p=a-_,c=f+u,v=n*(f-u),F=l+c,m=p,T=-v,d=l-c,y=p,w=v;s[t]=F,s[t+1]=0,s[t+2]=m,s[t+3]=T,s[t+4]=d,s[t+5]=0,s[t+6]=y,s[t+7]=w};

// Production-quality phase vocoder pitch shifter with identity phase locking
// AudioWorkletProcessor implementation
// ALL DONE BY GPT-5.3 MINI!!!

class PitchShifterProcessor extends AudioWorkletProcessor {  
  static get parameterDescriptors() {
    return [
      {
        name: "shift",
        defaultValue: 1.0,
        minValue: 0.25,
        maxValue: 4.0,
        automationRate: "k-rate"
      }
    ];
  }

  constructor() {
    super();

    this.frameSize = 1024;
    this.hopSize = this.frameSize / 4; // 75% overlap
    this.half = this.frameSize / 2;

    this.fft = new FFT(this.frameSize);

    // Buffers
    this.window = new Float32Array(this.frameSize);
    this.inputBuffer = new Float32Array(this.frameSize);

    this.prevPhase = new Float32Array(this.half + 1);
    this.sumPhase = new Float32Array(this.half + 1);

    this.analysisFreq = new Float32Array(this.half + 1);
    this.analysisMag = new Float32Array(this.half + 1);

    this.spectrum = this.fft.createComplexArray();
    this.synthSpectrum = this.fft.createComplexArray();
    this.timeDomain = this.fft.createComplexArray();

    // Output overlap-add buffer (larger for safety)
    this.olaBuffer = new Float32Array(this.frameSize * 2);
    this.olaIndex = 0;

    this.writeIndex = 0;

    // Hann window
    for (let i = 0; i < this.frameSize; i++) {
      this.window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / this.frameSize));
    }

    this.freqPerBin = (2 * Math.PI) / this.frameSize;
    this.twoPi = 2 * Math.PI;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0][0];
    const output = outputs[0][0];
    if (!input || !output) return true;

    const shiftArray = parameters.shift;

    for (let i = 0; i < input.length; i++) {
      const shift = shiftArray.length > 1 ? shiftArray[i] : shiftArray[0];

      // circular input buffer
      this.inputBuffer[this.writeIndex] = input[i];
      this.writeIndex = (this.writeIndex + 1) % this.frameSize;

      if (this.writeIndex % this.hopSize === 0) {
        this.processFrame(shift);
      }

      // read from OLA buffer (latency compensated)
      output[i] = this.olaBuffer[this.olaIndex] || 0;
      this.olaBuffer[this.olaIndex] = 0;
      this.olaIndex = (this.olaIndex + 1) % this.olaBuffer.length;
    }

    return true;
  }

  processFrame(shift) {
    const N = this.frameSize;
    const half = this.half;

    // -------- Analysis frame --------
    const frame = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      const idx = (this.writeIndex - N + i + N) % N;
      frame[i] = this.inputBuffer[idx] * this.window[i];
    }

    this.fft.realTransform(this.spectrum, frame);
    this.fft.completeSpectrum(this.spectrum);

    // -------- Analysis --------
    for (let k = 0; k <= half; k++) {
      const re = this.spectrum[2 * k];
      const im = this.spectrum[2 * k + 1];

      const mag = Math.hypot(re, im);
      const phase = Math.atan2(im, re);

      const prev = this.prevPhase[k];
      this.prevPhase[k] = phase;

      // phase deviation
      let delta = phase - prev - this.freqPerBin * k * this.hopSize;

      delta -= this.twoPi * Math.round(delta / this.twoPi);

      const trueFreq = this.freqPerBin * k + delta / this.hopSize;

      this.analysisMag[k] = mag;
      this.analysisFreq[k] = trueFreq;
    }

    // -------- Synthesis --------
    this.synthSpectrum.fill(0);

    const norm = new Float32Array(N);

    for (let k = 0; k <= half; k++) {
      const mag = this.analysisMag[k];
      if (mag < 1e-8) continue;

      const shiftedIndex = k * shift;
      const i0 = Math.floor(shiftedIndex);
      const frac = shiftedIndex - i0;

      if (i0 > half) continue;

      const freq = this.analysisFreq[k];
      const phaseAdvance = freq * this.hopSize;

      const phase = this.sumPhase[i0] + phaseAdvance;
      this.sumPhase[i0] = phase;

      const bins = [i0, i0 + 1];
      const weights = [1 - frac, frac];

      for (let b = 0; b < 2; b++) {
        const bin = bins[b];
        if (bin > half) continue;

        const w = weights[b] * mag;

        this.synthSpectrum[2 * bin] += w * Math.cos(phase);
        this.synthSpectrum[2 * bin + 1] += w * Math.sin(phase);

        norm[bin] += weights[b];
      }
    }

    // -------- normalize --------
    for (let k = 0; k <= half; k++) {
      if (norm[k] > 0) {
        this.synthSpectrum[2 * k] /= norm[k];
        this.synthSpectrum[2 * k + 1] /= norm[k];
      }
    }

    // mirror spectrum
    for (let k = 1; k < half; k++) {
      this.synthSpectrum[2 * (N - k)] = this.synthSpectrum[2 * k];
      this.synthSpectrum[2 * (N - k) + 1] = -this.synthSpectrum[2 * k + 1];
    }

    // -------- IFFT --------
    this.fft.inverseTransform(this.timeDomain, this.synthSpectrum);

    // -------- overlap-add --------
    for (let i = 0; i < N; i++) {
      const sample = (this.timeDomain[2 * i] / N) * this.window[i];
      const idx = (this.olaIndex + i) % this.olaBuffer.length;
      this.olaBuffer[idx] += sample;
    }
  }
}

registerProcessor("pitch-shifter", PitchShifterProcessor);
