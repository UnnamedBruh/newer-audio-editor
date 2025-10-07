// G.711 μ-law encode: convert 16-bit signed int (linear PCM) to 8-bit μ-law
// I did NOT write this function! GPT-4.0 Mini wrote this function, but was optimized by me.

const muLawCache2 = Object.create(null);

function linearToMuLaw(sample) {
	const chose = muLawCache2[sample];
	if (chose !== undefined) {
		return chose;
	}
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
	let result = muLawByte & 0xFF;
	muLawCache2[sample] = result;
	return result;
}

class AudioExporter { // This class is meant for the original programmer's development, not for public use; implement error handling, and handle other bits if invalid types are expected 
	constructor(audioData, sampleRate, channels, bits) {
		this.audioData = audioData;
		this.sampleRate = sampleRate;
		this.channels = channels;
		this.encoding = bits === 8 ? (audioData instanceof Int16Array ? "ulaw" : "pcm8") : (bits === 16 ? "pcm16" : bits === 32 ? (audioData instanceof Float32Array ? "pcmf32" : "pcm32") : "pcm16");
		this.bits = bits;
	}
	/*convertToWav(metadata = {}) {
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
	}*/
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

// Helper: convert float [-1,1] to 16-bit signed integer
function floatToInt16(sample) {
	return /*Math.max(-1, Math.min(1, */sample/*))*/ * 0x7FFF | 0;
}

// Helper: convert float [-1,1] to unsigned 8-bit PCM (0..255)
function floatToUint8(sample) {
	return Math.round((/*Math.max(-1, Math.min(1, */sample/*))*/ + 1) * 127.5) & 0xFF;
}

// μ-law expects 16-bit signed ints. Reuse your linearToMuLaw but ensure you pass int16.
function floatToMuLawByte(sample) {
	const int16 = floatToInt16(sample);
	return linearToMuLaw(int16);
}

// Build the LIST/INFO metadata as a Uint8Array using UTF-8 encoding
function buildInfoListChunk(metadataObj = {}) {
	if (
		!metadataObj ||
		typeof metadataObj !== "object" ||
		Object.keys(metadataObj).length === 0
	) {
		// Nothing to encode
		return null;
	}

	const tags = Object.keys(metadataObj);
	if (tags.length === 0) return null;

	const enc = new TextEncoder();
	let payloadLen = 4; // for "INFO"
	const tagBuffers = [];

	for (const tag of tags) {
		const valueStr = String(metadataObj[tag]);
		const valueBytes = enc.encode(valueStr);
		const valueLen = valueBytes.length;
		const pad = valueLen % 2 === 1 ? 1 : 0;
		const chunkLen = 8 + valueLen + pad; // tag + size + data + pad
		payloadLen += chunkLen;

		const chunk = new Uint8Array(chunkLen);
		chunk[0] = tag.charCodeAt(0);
		chunk[1] = tag.charCodeAt(1);
		chunk[2] = tag.charCodeAt(2);
		chunk[3] = tag.charCodeAt(3);
		// size little-endian
		chunk[4] = valueLen & 0xff;
		chunk[5] = (valueLen >> 8) & 0xff;
		chunk[6] = (valueLen >> 16) & 0xff;
		chunk[7] = (valueLen >> 24) & 0xff;
		chunk.set(valueBytes, 8);
		tagBuffers.push(chunk);
	}

	// "LIST" chunk header + "INFO" payload
	const listLen = 8 + payloadLen;
	const list = new Uint8Array(listLen);
	let o = 0;
	list[o++] = 0x4c; list[o++] = 0x49; list[o++] = 0x53; list[o++] = 0x54; // LIST
	list[o++] = payloadLen & 0xff;
	list[o++] = (payloadLen >> 8) & 0xff;
	list[o++] = (payloadLen >> 16) & 0xff;
	list[o++] = (payloadLen >> 24) & 0xff;
	list[o++] = 0x49; list[o++] = 0x4e; list[o++] = 0x46; list[o++] = 0x4f; // INFO

	for (const ch of tagBuffers) {
		list.set(ch, o);
		o += ch.length;
	}
	return list;
}

AudioExporter.prototype.convertToWav = function(metadata = {}) {
	const numChannels = this.channels || 1;
	const samples = this.audioData;
	const len = samples.length;
	const bits = this.bits || 32;
	const bytesPerSample = bits / 8;
	
	// Data chunk size (interleaving not needed for mono assumption; adjust for multi-channel)
	const dataChunkSize = len * bytesPerSample;

	// Build metadata LIST chunk (optional)
	const listChunk = buildInfoListChunk(metadata);
	const listChunkSizeBytes = listChunk ? listChunk.length : 0;

	// fmt chunk size for PCM is 16
	const fmtChunkSize = 16;
	const fmtChunkTotal = 8 + fmtChunkSize; // "fmt " + size + payload
	const dataChunkTotal = 8 + dataChunkSize; // "data" + size + payload
	const listChunkTotal = listChunk ? (listChunkSizeBytes) : 0; // list chunk already includes "LIST"+size

	// RIFF chunk size = 4 (WAVE) + fmtChunkTotal + dataChunkTotal + listChunkTotal
	const riffChunkSize = 4 + fmtChunkTotal + dataChunkTotal + listChunkTotal;
	const totalSize = 8 + riffChunkSize; // total file size = 8 + riffChunkSize

	const buffer = new ArrayBuffer(totalSize);
	const view = new DataView(buffer);
	let offset = 0;

	// RIFF header
	this.writeString(view, offset, 'RIFF'); offset += 4;
	view.setUint32(offset, riffChunkSize, true); offset += 4;
	this.writeString(view, offset, 'WAVE'); offset += 4;

	// fmt chunk
	this.writeString(view, offset, 'fmt '); offset += 4;
	view.setUint32(offset, fmtChunkSize, true); offset += 4;
	// audioFormat: 1 = PCM integer, 3 = IEEE float, 7 = μ-law
	let audioFormat = 1;
	if (this.encoding.startsWith("pcmf")) audioFormat = 3;
	else if (this.encoding === "ulaw") audioFormat = 7;
	else audioFormat = 1;
	view.setUint16(offset, audioFormat, true); offset += 2;
	view.setUint16(offset, numChannels, true); offset += 2;
	view.setUint32(offset, this.sampleRate, true); offset += 4;
	view.setUint32(offset, this.sampleRate * numChannels * bytesPerSample, true); offset += 4; // byte rate
	view.setUint16(offset, numChannels * bytesPerSample, true); offset += 2; // block align
	view.setUint16(offset, bits, true); offset += 2;

	// data chunk header
	this.writeString(view, offset, 'data'); offset += 4;
	view.setUint32(offset, dataChunkSize, true); offset += 4;

	// write sample data
	if (audioFormat === 3) { // float
		if (bits === 32) {
			for (let i = 0; i < len; i++) {
				view.setFloat32(offset, samples[i], true);
				offset += 4;
			}
		} else { // 64-bit float
			for (let i = 0; i < len; i++) {
				view.setFloat64(offset, samples[i], true);
				offset += 8;
			}
		}
	} else if (this.encoding === "ulaw") {
		// convert to mu-law bytes
		for (let i = 0; i < len; i++) {
			const b = floatToMuLawByte(samples[i]);
			view.setUint8(offset, b);
			offset += 1;
		}
	} else { // PCM integer
		if (bits === 8) {
			for (let i = 0; i < len; i++) {
				const b = floatToUint8(samples[i]);
				view.setUint8(offset, b);
				offset += 1;
			}
		} else if (bits === 16) {
			for (let i = 0; i < len; i++) {
				const s = floatToInt16(samples[i]);
				view.setInt16(offset, s, true);
				offset += 2;
			}
		} else if (bits === 32) {
			// PCM 32-bit integer (rare); convert floats to 32-bit signed ints
			for (let i = 0; i < len; i++) {
				const v = Math.max(-1, Math.min(1, samples[i]));
				const i32 = Math.round(v * 0x7FFFFFFF);
				view.setInt32(offset, i32, true);
				offset += 4;
			}
		}
	}

	// append LIST chunk bytes if present
	if (listChunk) {
		const final = new Uint8Array(buffer);
		final.set(listChunk, offset);
		// offset += listChunk.length; // not used further
	}

	return new Blob([buffer], { type: 'audio/wav' });
};

