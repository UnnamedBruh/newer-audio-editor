// G.711 μ-law encode: convert 16-bit signed int (linear PCM) to 8-bit μ-law
function linearToMuLaw(sample) {
	const MU_LAW_MAX = 0x7FFF;
	const BIAS = 0x84;

	let sign = (sample >> 8) & 0x80;
	if (sign) sample = -sample;
	if (sample > MU_LAW_MAX) sample = MU_LAW_MAX;
	sample += BIAS;

	// Calculate exponent exactly as original loop
	let exponent = 7;
	for (let expMask = 0x4000; expMask > 0x7F; expMask >>= 1) {
		if (sample & expMask) {
			break;
		}
		exponent--;
	}

	let mantissa = (sample >> (exponent + 3)) & 0x0F;
	let muLawByte = ~(sign | (exponent << 4) | mantissa);
	return muLawByte & 0xFF;
}

function scaEncode(floatData, sampleRate) {
	const header = new Uint8Array(32);
	
}

class AudioExporter { // This class is meant for the original programmer's development, not for public use; implement error handling, and handle other bits if invalid types are expected 
	constructor(audioData, sampleRate, channels, bits) {
		this.audioData = audioData;
		this.sampleRate = sampleRate;
		this.channels = channels;
		this.encoding = bits === 8 ? (audioData instanceof Int16Array ? "ulaw" : "pcm8") : (bits === 16 ? "pcm16" : bits === 32 ? (audioData instanceof Float32Array ? "pcmf32" : "pcm32") : "pcm16");
		this.bits = bits;
	}
	convertToWav(metadata) {
		const numChannels = this.channels, len = this.audioData.length;
		const len2 = len * (this.bits / 8);

		const metaBuffer = new ArrayBuffer(1024); // metadata space + padding
		const metaView = new DataView(metaBuffer);
		const metaLength = this.addMetadata(metaView, 0, metadata);
		
		const buffer = new ArrayBuffer(44 + len2 + metaLength);
		const view = new DataView(buffer);
		this.writeString(view, 0, 'RIFF');
		view.setUint32(4, 36 + len2, true);
		this.writeString(view, 8, 'WAVE');
		this.writeString(view, 12, 'fmt ');
		view.setUint32(16, 16, true);
		view.setUint16(20, this.encoding.startsWith("pcmf") ? 3 : this.encoding.startsWith("pcm") ? 1 : 7, true); // The type of PCM (1 = integer-based, 3 = IEEE 754 floating-point-based, 7 = μ-law - used mainly for telephones and voice-only audio)
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
		const metaArray = new Uint8Array(metaBuffer.slice(0, metaLength));
		const finalArray = new Uint8Array(buffer);
		finalArray.set(metaArray, offset);
		return new Blob([view.buffer], { type: 'audio/wav' });
	}
	writeString(view, offset, string) {
		for (let i = 0; i < string.length; i++) {
			view.setUint8(offset + i, string.charCodeAt(i));
		}
	}
	addMetadata(view, offset, metadata = {}) {
		function writeTag(tag, value) {
			const tagLen = value.length + (value.length % 2 === 0 ? 1 : 0);
			view.setUint8(offset++, tag.charCodeAt(0));
			view.setUint8(offset++, tag.charCodeAt(1));
			view.setUint8(offset++, tag.charCodeAt(2));
			view.setUint8(offset++, tag.charCodeAt(3));
			view.setUint32(offset, tagLen, true); offset += 4;
			for (let i = 0; i < value.length; i++) {
				view.setUint8(offset++, value.charCodeAt(i));
			}
			view.setUint8(offset++, 0);
			if (value.length % 2 === 0) offset++;
			return offset;
		}
	
		const startOffset = offset;
		this.writeString(view, offset, 'LIST'); offset += 4;
		const sizePos = offset; offset += 4; // Placeholder
		this.writeString(view, offset, 'INFO'); offset += 4;
	
		for (const tag in metadata) {
			const value = metadata[tag];
			offset = writeTag(tag, value);
		}
	
		// Set LIST chunk size
		view.setUint32(sizePos, offset - startOffset - 8, true);
		return offset;
	}
};
