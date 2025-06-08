class AudioExporter { // This class is meant for the original programmer's development, not for public use; implement error handling, and handle other bits if invalid types are expected 
	constructor(audioData, sampleRate, channels, bits) {
		this.audioData = audioData;
		this.sampleRate = sampleRate;
		this.channels = channels;
		this.bits = bits;
	}
	convertToWav(floatPoint = false) {
		const numChannels = this.channels, len = this.audioData.length;
		if (floatPoint || tihs.bits !== 64) this.bits = 32;
		const len2 = len * (this.bits / 8);
		const buffer = new ArrayBuffer(44 + len2);
		const view = new DataView(buffer);
		this.writeString(view, 0, 'RIFF');
		view.setUint32(4, 36 + len2, true);
		this.writeString(view, 8, 'WAVE');
		this.writeString(view, 12, 'fmt ');
		view.setUint32(16, 16, true);
		view.setUint16(20, floatPoint ? 3 : 1, true); // The type of PCM (1 = integer-based, 3 = IEEE 754 floating-point-based)
		view.setUint16(22, numChannels, true);
		view.setUint32(24, this.sampleRate, true);
		view.setUint32(28, this.sampleRate * this.channels * (this.bits / 8), true);
		view.setUint16(32, this.channels * (this.bits / 8), true);
		view.setUint16(34, this.bits, true);
		this.writeString(view, 36, 'data');
		view.setUint32(40, len2, true);
		let offset = 44, pointer = this.audioData;
		if (floatPoint) {
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
			if (this.bits === 8) {
				for (let i = 0; i < len; i++) {
					view.setUint8(offset, pointer[i], true);
					offset++;
				}
			} else {
				for (let i = 0; i < len; i++) {
					view.setInt16(offset, pointer[i], true);
					offset += 2;
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

