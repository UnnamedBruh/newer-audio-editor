// G.711 μ-law encode: convert 16-bit linear PCM to 8-bit μ-law
// I used AI for this function (pls forgive me if im lazy)
function linearToMuLaw(sample) {
	const MU_LAW_MAX = 0x1FFF; // Max 13-bit magnitude
	const BIAS = 0x84; // Bias for linear code

	let sign = (sample >> 8) & 0x80;
	if (sign) sample = -sample;
	if (sample > MU_LAW_MAX) sample = MU_LAW_MAX;
	sample += BIAS;

	let exponent = 7;
	for (let expMask = 0x4000; (sample & expMask) === 0 && exponent > 0; expMask >>= 1) {
		exponent--;
	}
	let mantissa = (sample >> (exponent + 3)) & 0x0F;
	let muLawByte = ~(sign | (exponent << 4) | mantissa);
	return muLawByte & 0xFF;
}

class AudioExporter { // This class is meant for the original programmer's development, not for public use; implement error handling, and handle other bits if invalid types are expected 
	constructor(audioData, sampleRate, channels, bits) {
		this.audioData = audioData;
		this.sampleRate = sampleRate;
		this.channels = channels;
		this.encoding = bits === 8 ? (audioData instanceof Int16Array ? "ulaw" : "pcm8") : (bits === 16 ? "pcm16" : bits === 32 ? (audioData instanceof Float32Array ? "pcmf32" : "pcm32") : "pcm16");
		this.bits = bits;
	}
	convertToWav() {
		const numChannels = this.channels, len = this.audioData.length;
		const len2 = len * (this.bits / 8);
		const buffer = new ArrayBuffer(44 + len2);
		const view = new DataView(buffer);
		this.writeString(view, 0, 'RIFF');
		view.setUint32(4, 36 + len2, true);
		this.writeString(view, 8, 'WAVE');
		this.writeString(view, 12, 'fmt ');
		view.setUint32(16, 16, true);
		view.setUint16(20, this.encoding.startsWith("pcmf") ? 3 : this.encoding.startsWith("pcm") ? 1 : 7, true); // The type of PCM (1 = integer-based, 3 = IEEE 754 floating-point-based, 7 = μ-law - used in )
		view.setUint16(22, numChannels, true);
		view.setUint32(24, this.sampleRate, true);
		view.setUint32(28, this.sampleRate * this.channels * (this.bits / 8), true);
		view.setUint16(32, this.channels * (this.bits / 8), true);
		view.setUint16(34, this.bits, true);
		this.writeString(view, 36, 'data');
		view.setUint32(40, len2, true);
		let offset = 44, pointer = this.audioData;
		if (this.encoding.startsWith("pcmf")) {
			if (this.bits === 32) {
				for (let i = 0; i < len; i++) {
					view.setFloat32(offset, pointer[i], true);
					offset += 4;
				}
			} else {
				for (let i = 0; i < len; i++) {
					view.setFloat64(offset, pointer[i], true);
					offset += 8;
				}
			}
		} else {
			if (this.encoding === "ulaw") {
				for (let i = 0; i < len; i++) {
					view.setUint8(offset, linearToMuLaw(pointer[i]));
					offset++;
				}
			} else if (this.encoding.startsWith("pcm")) {
				if (this.bits === 8) {
					for (let i = 0; i < len; i++) {
						view.setUint8(offset, pointer[i]);
						offset++;
					}
				} else {
					for (let i = 0; i < len; i++) {
						view.setInt16(offset, pointer[i], true);
						offset += 2;
					}
				}
			}
		}
		return new Blob([view.buffer], { type: 'audio/wav' });
	}
	writeString(view, offset, string) {
		for (let i = 0; i < string.length; i++) {
			view.setUint8(offset + i, string.charCodeAt(i));
		}
	}
};
