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

	const originalSampleUnchanged = sample;
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
	muLawCache2[originalSampleUnchanged] = result;
	return result;
}

// This function was written by Gemini, in Google Search.
function encodeDPCM(pcmData) {
	const encodedData = new Int8Array(pcmData.length);
	let previousSample = 0; // Initial prediction

	const len = pcmData.length;

	for (let i = 0; i < len; i++) {
		// Convert float PCM sample to an integer range (e.g., -128 to 127)
		const currentSampleInt = Math.round(pcmData[i] * 127);
		
		// Calculate the difference (error)
		let difference = currentSampleInt - previousSample;
		
		// Quantize the difference (for simplicity, we cast to Int8 which naturally quantizes)
		// More advanced DPCM involves a dedicated quantization step and codebook
		const quantizedDifference = Math.max(-128, Math.min(127, difference));
		
		// Store the quantized difference
		encodedData[i] = quantizedDifference;
		
		// Update the 'previous sample' for the next prediction
		// In a simple closed-loop DPCM, the prediction for the next sample is 
		// the reconstructed current sample (previous prediction + quantized difference)
		previousSample = previousSample + quantizedDifference;
	}
	return encodedData;
}

class AudioExporter { // This class is meant for the original programmer's development, not for public use; implement error handling, and handle other bits if invalid types are expected 
	constructor(audioData, sampleRate, channels, bits) {
		this.audioData = audioData;
		this.sampleRate = sampleRate;
		this.channels = channels;
		this.encoding = bits === 8 ? (audioData instanceof Int16Array ? "ulaw" : "pcm8") : (bits === 16 ? "pcm16" : bits === 32 ? (audioData instanceof Float32Array ? "pcmf32" : "pcm32") : "pcm16");
		this.bits = bits;
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

// Helper: convert float [-1,1] to 16-bit signed integer
function floatToInt16(sample) {
	return sample * 0x7FFF | 0;
}

// Helper: convert float [-1,1] to unsigned 8-bit PCM (0..255)
function floatToUint8(sample) {
	return (((sample + 1) * 127.5) | 0) & 0xFF;
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

const A = 87.6;
const INVA = 1 / A;
const ALOG = 1+Math.log(A);

function floatToAlaw(float) {
	const sign = (float<0?-1:float>0?1:0);
	const abs = (float<0?-float:float);
	if (0 <= abs && abs <= INVA) {
		return sign * A * abs / ALOG
	} else if (INVA <= abs && abs <= 1) {
		return sign * (1 + Math.log(A * abs)) / ALOG;
	}
	return NaN;
}

let table = Object.create(null);
let keys = 0;
let x;
// This function was written by GPT-5.0 Mini, and altered by me (to optimize the function).
function floatToAlawByte(float) {
	if ((x = table[float]) !== undefined) return x;
	// Clamp input to [-1, 1]
	x = float;
	let sign = 0;
	if (x < 0) {
		sign = 0x80; // sign bit
		x = -x;
	}

	// Scale float [-1,1] to 12-bit PCM (0..4095)
	const PCM_MAX = 4095;
	let pcmVal = Math.floor(x * PCM_MAX + 0.5);

	// Determine segment
	let segment = 0;
	if (pcmVal >= 256) segment = 1;
	if (pcmVal >= 512) segment = 2;
	if (pcmVal >= 1024) segment = 3;
	if (pcmVal >= 2048) segment = 4;
	if (pcmVal >= 4096) segment = 5; // won't happen for x <= 1

	// Determine step within segment
	let step;
	if (segment === 0) {
		step = (pcmVal >> 4) & 0x0F;
	} else {
		step = (pcmVal >> (segment + 3)) & 0x0F;
	}

	// Compose byte: sign | segment | step
	let byte = sign | (segment << 4) | step;
	// Apply bit inversion (A-law standard)
	byte ^= 0x55;

	if (keys >= 65536) {
		table = Object.create(null);
		keys = 0;
	} else {
		table[float] = byte;
		keys++;
	}

	return byte;
}

AudioExporter.prototype.convertToWav = function(metadata = {}, buffer2, encodeBetter) {
	function writeString(view, offset, string) {
		for (let i = 0; i < string.length; i++) {
			view.setUint8(offset + i, string.charCodeAt(i));
		}
	}
	const numChannels = buffer2 ? 2 : 1;
	const numOfChannels = numChannels;
	const samples = this.audioData;
	const len = samples.length;
	const bits = this.bits || 32;
	let bytesPerSample = bits / 8;
	if (encodeBetter && bits === 12) bytesPerSample = 2;
	if (this.encoding === "nesdpcm") bytesPerSample = 0.125;
	
	// Data chunk size (interleaving not needed for mono assumption; adjust for multi-channel)
	const dataChunkSize = len * bytesPerSample * numChannels;

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
	writeString(view, offset, 'RIFF'); offset += 4;
	view.setUint32(offset, riffChunkSize, true); offset += 4;
	writeString(view, offset, 'WAVE'); offset += 4;

	// fmt chunk
	writeString(view, offset, 'fmt '); offset += 4;
	view.setUint32(offset, fmtChunkSize, true); offset += 4;
	// audioFormat: 1 = PCM integer, 2 = ADPCM or DPCM, 3 = IEEE float, 7 = μ-law
	let audioFormat = 1;
	if (this.encoding.startsWith("pcmf")) audioFormat = 3;
	else if (this.encoding === "ulaw") audioFormat = 7;
	else if (this.encoding === "alaw") audioFormat = 6; // https://www.mmsp.ece.mcgill.ca/Documents/AudioFormats/WAVE/WAVE.html
	else if (this.encoding === "nesdpcm") audioFormat = 2; // https://billposer.org/Linguistics/Computation/LectureNotes/WAVEFormatCodes.html
	else if (this.encoding === "xandpcm") audioFormat = 22858; // https://wiki.multimedia.cx/index.php/Xan_DPCM
	else audioFormat = 1;
	view.setUint16(offset, audioFormat, true); offset += 2;
	view.setUint16(offset, numChannels, true); offset += 2;
	view.setUint32(offset, this.sampleRate, true); offset += 4;
	view.setUint32(offset, this.sampleRate * numChannels * bytesPerSample, true); offset += 4; // byte rate
	view.setUint16(offset, numChannels * bytesPerSample, true); offset += 2; // block align
	view.setUint16(offset, bits, true); offset += 2;

	// data chunk header
	writeString(view, offset, 'data'); offset += 4;
	view.setUint32(offset, dataChunkSize, true); offset += 4;

	// write sample data
	if (audioFormat === 3) { // float
		if (bits === 32) {
			if (numOfChannels === 2) {
				for (let i = 0; i < len; i++) {
					view.setFloat32(offset, samples[i], true);
					offset += 4;
					view.setFloat32(offset, buffer2[i], true);
					offset += 4;
				}
			} else {
				for (let i = 0; i < len; i++) {
					view.setFloat32(offset, samples[i], true);
					offset += 4;
				}
			}
		} else { // 64-bit float
			if (numOfChannels === 2) {
				for (let i = 0; i < len; i++) {
					view.setFloat64(offset, samples[i], true);
					offset += 8;
					view.setFloat64(offset, buffer2[i], true);
					offset += 8;
				}
			} else {
				for (let i = 0; i < len; i++) {
					view.setFloat64(offset, samples[i], true);
					offset += 8;
				}
			}
		}
	} else if (this.encoding === "ulaw") {
		// convert to mu-law bytes
		if (numOfChannels === 2) {
			for (let i = 0; i < len; i++) {
				let b = floatToMuLawByte(samples[i]);
				view.setUint8(offset, b);
				offset++;
				b = floatToMuLawByte(buffer2[i]);
				view.setUint8(offset, b);
				offset++;
			}
		} else {
			for (let i = 0; i < len; i++) {
				const b = floatToMuLawByte(samples[i]);
				view.setUint8(offset, b);
				offset++;
			}
		}
	} else if (this.encoding === "alaw") {
		// convert to mu-law bytes
		if (numOfChannels === 2) {
			for (let i = 0; i < len; i++) {
				let b = floatToAlawByte(Math.round(samples[i] * 65536) / 65536);
				view.setUint8(offset, b);
				offset++;
				b = floatToAlawByte(Math.round(buffer2[i] * 65536) / 65536);
				view.setUint8(offset, b);
				offset++;
			}
		} else {
			for (let i = 0; i < len; i++) {
				const b = floatToAlawByte(Math.round(samples[i] * 65536) / 65536);
				view.setUint8(offset, b);
				offset++;
			}
		}
	} else if (this.encoding === "nesdpcm") {
		// convert to NES DPCM
		// According to source: https://www.reddit.com/r/retrogamedev/comments/yb6s8o/could_an_nes_programmer_explain_why_the/, and Google Search
		function warn(){alert("Your audio contains silent or quiet sections, which may result in very high-pitched \"buzzing\" artifacts. This is due to how delta encoding is decided.");return false}
		if (numOfChannels === 2) {
			alert("The NES hardware doesn't traditionally support stereo audio. This is just an important point to consider, not an error.");
			let silent = true;
			let difference = 0;
			let i = 0;
			let byteSequence = new Uint8Array([1,2,4,8,16,32,64,128]);
			for (let i = 0; i < len;) {
				let nd = 0;
				let currentSample = 0;
				let b = 0;
				for (let x = 0; x < 4; x++) {
					b = Math.round((samples[i] + 1) * 8);
					if (silent&&b===8) silent = warn();
					if (difference > b) {difference++;currentSample|=byteSequence[nd]} else {difference--;}
					nd++;

					b = Math.round((buffer2[i] + 1) * 8);
					if (difference > b) {difference++;currentSample|=byteSequence[nd]} else {difference--;}
					i++;
					nd++;
					if (i >= len) break;
				}
				view.setUint8(offset, currentSample);
				offset++;
			}
		} else {
			let silent = true;
			let difference = 0;
			let i = 0;
			let byteSequence = new Uint8Array([0,2,4,8,16,32,64,128]);
			for (let i = 0; i < len;) {
				let b = Math.round((samples[i] + 1) * 8);
				if (silent&&b===8) silent = warn();
				let currentSample = 0;
				if (difference > b) {difference++;currentSample=1} else {difference--;}
				i++;

				for (let j = 1; j < 8; j++) {
					b = Math.round((samples[i] + 1) * 8);
					if (difference > b) {difference++;currentSample|=byteSequence[j]} else {difference--;}
					i++;
					if (i >= len) break;
				}

				view.setUint8(offset, currentSample);
				offset++;
			}
		}
	} else if (this.encoding === "xandpcm") {
		// I used GPT-5.0 Mini to help me with clarifying the encoding process. The original psuedo code I got only showed me decoding.
		// However, the encoding snippets are not written by GPT-5.0 Mini or one of other language models.
		if (numOfChannels === 2) {
			let diff = 0, predictorL = 0, prevDiffL = 0, predictorR = 0, prevDiffR = 0;
			for (let i = 0; i < len; i++) {
				diff = samples[i] - predictorL;
				let currentSample = 0;
				let shift = 3 - Math.round(abs(diff - prevDiffL) * 3);
				if (shift>3)shift=3;else if(shift<0)shift=0;
				
				predictorL = predictorL + 0.5 * ((samples[i+2] || 0) - predictorL);
				prevDiffL = diff;

				view.setUint8(offset, shift | (((predictorL + 1) * 0x1F) << 2));
				offset++;

				diff = buffer2[i] - predictorR;
				currentSample = 0;
				shift = 3 - Math.round(abs(diff - prevDiffR) * 3);
				if (shift>3)shift=3;else if(shift<0)shift=0;
				
				predictorR = predictorR + 0.5 * ((buffer2[i+2] || 0) - predictorR);
				prevDiffR = diff;

				view.setUint8(offset, shift | (((predictorR + 1) * 0x1F) << 2));
				offset++;
			}
		} else {
			// https://wiki.multimedia.cx/index.php/Xan_DPCM
			// Implemented exactly as directed
			/*	 byte = next byte in stream 
	diff = (byte & 0xFC) << 8
	if bottom 2 bits of byte are both 1 (byte & 0x03)
		 shifter++
	else
		 shifter -= (2 * (byte & 3))
	note that the shift value may not go below 0 and must be saturated here
	shift diff right by shifter value
	apply diff to the current predictor
	saturate predictor to signed, 16-bit range */

			// But we're going to do the opposite of that.
			let diff = 0, predictor = 0, prevDiff = 0;
			for (let i = 0; i < len; i++) {
				diff = samples[i] - predictor;
				let currentSample = 0;
				let shift = 3 - Math.round(abs(diff - prevDiff) * 3);
				if (shift>3)shift=3;else if(shift<0)shift=0;
				
				predictor = predictor + 0.5 * ((samples[i+2] || 0) - predictor);
				prevDiff = diff;

				view.setUint8(offset, shift | (((predictor + 1) * 0x1F) << 2));
				offset++;
			}
		}
	} else { // PCM integer
		if (numOfChannels === 2) {
			if (bits === 8) {
				for (let i = 0; i < len; i++) {
					let b = floatToUint8(samples[i]);
					view.setUint8(offset, b);
					offset++;
					b = floatToUint8(buffer2[i]);
					view.setUint8(offset, b);
					offset++;
				}
			} else if (bits === 12) {
				if (encodeBetter) {
					for (let i = 0; i < len; i++) {
						let b = Math.round((samples[i]+1) * 2047.5);
						let x = Math.round((buffer2[i]+1) * 2047.5);
						view.setUint16(offset, b & 0xFFF, true);
						offset += 2;
						view.setUint16(offset, x & 0xFFF, true);
						offset += 2;
					}
				} else {
					for (let i = 0; i < len; i++) {
						let b = Math.round((samples[i]+1) * 2047.5);
						view.setUint8(offset, b & 0xFF);
						let x = (b & 0xFFF) >> 8;
						offset++;
						b = Math.round((buffer2[i]+1) * 2047.5);
						x = x | ((b & 0xF) << 4);
						view.setUint8(offset, x);
						offset++;
						view.setUint8(offset, (b >> 4) & 0xFF);
						offset++;
					}
				}
			} else if (bits === 16) {
				for (let i = 0; i < len; i++) {
					let s = floatToInt16(samples[i]);
					view.setInt16(offset, s, true);
					offset += 2;
					s = floatToInt16(buffer2[i]);
					view.setInt16(offset, s, true);
					offset += 2;
				}
			} else if (bits === 24) {
				for (let i = 0; i < len; i++) {
					let value = samples[i] * 8388607;
					view.setInt8(offset, value & 0xFF);
					offset++;
					view.setInt8(offset, (value >> 8) & 0xFF);
					offset++;
					view.setInt8(offset, (value >> 16) & 0xFF);
					offset++;
					value = buffer2[i] * 8388607;
					view.setInt8(offset, value & 0xFF);
					offset++;
					view.setInt8(offset, (value >> 8) & 0xFF);
					offset++;
					view.setInt8(offset, (value >> 16) & 0xFF);
					offset++;
				}
			} else if (bits === 32) {
				// PCM 32-bit integer (rare); convert floats to 32-bit signed ints
				for (let i = 0; i < len; i++) {
					let i32 = Math.round(samples[i] * 0x7FFFFFFF);
					view.setInt32(offset, i32, true);
					offset += 4;
					i32 = Math.round(buffer2[i] * 0x7FFFFFFF);
					view.setInt32(offset, i32, true);
					offset += 4;
				}
			}
		} else {
			if (bits === 8) {
				for (let i = 0; i < len; i++) {
					const b = floatToUint8(samples[i]);
					view.setUint8(offset, b);
					offset++;
				}
			} else if (bits === 12) {
				if (encodeBetter) {
					for (let i = 0; i < len; i++) {
						let b = Math.round((samples[i]+1) * 2047.5);
						view.setUint16(offset, b & 0xFFF, true);
						offset += 2;
					}
				} else {
					i = 0;
					for (let i = 0; i < len;) {
						let b = Math.round((samples[i]+1) * 2047.5);
						view.setUint8(offset, b & 0xFF);
						let x = (b & 0xFFF) >> 8;
						offset++;
						i++;
						b = Math.round((samples[i]+1) * 2047.5);
						x = x | ((b & 0xF) << 4);
						view.setUint8(offset, x);
						offset++;
						view.setUint8(offset, (b >> 4) & 0xFF);
						offset++;
						i++;
					}
				}
			} else if (bits === 16) {
				for (let i = 0; i < len; i++) {
					const s = floatToInt16(samples[i]);
					view.setInt16(offset, s, true);
					offset += 2;
				}
			} else if (bits === 24) {
				for (let i = 0; i < len; i++) {
					let value = samples[i] * 8388607;
					view.setInt8(offset, value & 0xFF);
					offset++;
					view.setInt8(offset, (value >> 8) & 0xFF);
					offset++;
					view.setInt8(offset, (value >> 16) & 0xFF);
					offset++;
				}
			} else if (bits === 32) {
				// PCM 32-bit integer (rare); convert floats to 32-bit signed ints
				for (let i = 0; i < len; i++) {
					const i32 = Math.round(samples[i] * 0x7FFFFFFF);
					view.setInt32(offset, i32, true);
					offset += 4;
				}
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

AudioExporter.prototype.convertToSol = async function(buffer2) { // https://wiki.multimedia.cx/index.php/Sierra_Audio
	alert("SOL (Sierra Audio) FILES CAN OFFICIALLY BE ENCODED WITHOUT ANY ISSUES! VIDEO GAME FILES ARE BACK FROM THE LOST AND FOUND! EVERYONE CAN CELEBRATE SIERRA ENTERTAINMENT AGAIN!\n\nThe format was carefully reverse-engineered through online sources and real samples of audio in the .sol format!\n\nA documented format that was originally ambiguous can now be accessed... correctly! However, only PCM encoding is supported as of now. BUT, there will be more later!");
	function writeString(view, offset, string) {
		for (let i = 0; i < string.length; i++) {
			view.setUint8(offset + i, string.charCodeAt(i));
		}
	}
	const numChannels = buffer2 ? 2 : 1;
	const numOfChannels = numChannels;
	const samples = this.audioData;
	const len = samples.length;
	const bits = this.bits || 8;
	if (this.encoding === "dpcmold") this.SOLversion = 0x8D; else this.SOLversion = 0x0D;
	const version = this.SOLversion; // 0x0D (newer) or 0x8D (older) | https://samples.mplayerhq.hu/game-formats/sol/
	let bytesPerSample = bits / 8;
	if (this.encoding === "dpcm") bytesPerSample = bits / 16;

	const dataChunkSize = len * bytesPerSample * numChannels;
	// header chunk size for SOL can be either 12 (padded) or 11 (nonpadded). However, personally, I like to pad SOL files.
	const headerChunkSize = 12;
	const totalSize = 2 + 2 + headerChunkSize + dataChunkSize;

	const buffer = new ArrayBuffer(totalSize);
	const view = new DataView(buffer);

	view.setUint8(0, version);
	view.setUint8(1, headerChunkSize);

	let offset = 2;

	writeString(view, offset, "SOL"); offset += 4;
	view.setUint16(offset, this.sampleRate, true); offset += 2;

	let flags = 0;
	const DPCM = 1;
	const STEREO = 4;
	const SIXTEENBIT = 16;

	if (this.bits >= 16) flags |= SIXTEENBIT;
	if (numChannels === 2) flags |= STEREO;
	if (this.encoding.startsWith("dpcm")) flags |= DPCM;

	view.setUint8(offset++, flags);
	view.setUint16(offset, (totalSize - 14) & 0xFFFF, true); offset += 2;
	if (headerChunkSize === 12) view.setUint8(offset++, 0x00, true); // Audio starts immediately after legacy two-byte padding
	offset += 2;
	const temp = this.encoding;
	this.encoding = flags & DPCM ? "pcm" : "";
	if (this.encoding === "pcm") {
		let buff = await this.convertToWav({}, samples, buffer2).arrayBuffer();
		buff = new Uint8Array(buff);
		new Uint8Array(view.buffer).set(buff.subarray(44, buff.length), offset);
	} else {
		this.encoding = temp;
		const SOLTable3bit = new Uint8Array([0,1,2,3,6,0xA,0xF,0x15]);const SOLTable7bit = new Uint16Array([0x0,	0x8,	 0x10,	0x20,	0x30,	0x40,	0x50,	0x60,	0x70,	0x80,	0x90,	0xA0,	0xB0,	0xC0,	0xD0,	0xE0,	0xF0,	0x100,	0x110,	0x120,	0x130,	0x140,	0x150,	0x160,	0x170,	0x180,	0x190,	0x1A0,	0x1B0,	0x1C0,	0x1D0,	0x1E0,	0x1F0,	0x200,	0x208,	0x210,	0x218,	0x220,	0x228,	0x230,	0x238,	0x240,	0x248,	0x250,	0x258,	0x260,	0x268,	0x270,	0x278,	0x280,	0x288,	0x290,	0x298,	0x2A0,	0x2A8,	0x2B0,	0x2B8,	0x2C0,	0x2C8,	0x2D0,	0x2D8,	0x2E0,	0x2E8,	0x2F0,	0x2F8,	0x300,	0x308,	0x310,	0x318,	0x320,	0x328,	0x330,	0x338,	0x340,	0x348,	0x350,	0x358,	0x360,	0x368,	0x370,	0x378,	0x380,	0x388,	0x390,	0x398,	0x3A0,	0x3A8,	0x3B0,	0x3B8,	0x3C0,	0x3C8,	0x3D0,	0x3D8,	0x3E0,	0x3E8,	0x3F0,	0x3F8,	0x400,	0x440,	0x480,	0x4C0,	0x500,	0x540,	0x580,	0x5C0,	0x600,	0x640,	0x680,	0x6C0,	0x700,	0x740,	0x780,	0x7C0,	0x800,	0x900,	0xA00,	0xB00,	0xC00,	0xD00,	0xE00,	0xF00,	0x1000, 0x1400, 0x1800, 0x1C00, 0x2000, 0x3000, 0x4000]);
		let CurSample = 0x80;
		let Difference = 0x00;
		function chooseIndexClosest(array, value) {
			if (value === 0) return 0;
			else if (value > 0x4000) return array[array.length - 1];
			for (let i = 0; i < array.length; i++) {
				if (value < array[i]) return i;
			}
			return array[array.length - 1];
		}
		if (bits === 4) {
			if (numOfChannels === 1) {
				for (let i = 0; i < len; i += 2) {
					let currentSample = 0;
					CurSample = (samples[i] + 1) * 0x7F;
					Difference = CurSample - Difference;
					currentSample = (chooseIndexClosest(SOLTable3bit, Math.abs(Difference)) | (Difference<0?8:0));
					if (i + 1 > len) break;
					CurSample = (samples[i+1] + 1) * 0x7F;
					Difference = CurSample - Difference;
					currentSample |= (chooseIndexClosest(SOLTable3bit, Math.abs(Difference)) | (Difference<0?8:0)) << 4;
					view.setUint8(offset++, currentSample);
				}
			} else {
				let Difference2 = 0x00;
				for (let i = 0; i < len; i++) {
					let currentSample = 0;
					CurSample = (samples[i] + 1) * 0x7F;
					Difference = CurSample - Difference;
					currentSample = (chooseIndexClosest(SOLTable3bit, Math.abs(Difference)) | (Difference<0?8:0)) << 4;
					if (i + 1 > len) break;
					CurSample = (buffer2[i] + 1) * 0x7F;
					Difference2 = CurSample - Difference;
					currentSample |= chooseIndexClosest(SOLTable3bit, Math.abs(Difference2)) | (Difference2<0?8:0);
					view.setUint8(offset++, currentSample);
				}
			}
		} else if (bits === 8) {
			if (numOfChannels === 1) {
				for (let i = 0; i < len; i++) {
					CurSample = (samples[i] + 1) * 0x7FFF;
					Difference = CurSample - Difference;
					currentSample = chooseIndexClosest(SOLTable7bit, Math.abs(Difference)) | (Difference<0?128:0);
					view.setUint8(offset++, currentSample);
				}
			} else {
				let Difference2 = 0x00;
				for (let i = 0; i < len; i++) {
					let currentSample = 0;
					CurSample = (samples[i] + 1) * 0x777F;
					Difference = CurSample - Difference;
					currentSample = chooseIndexClosest(SOLTable7bit, Math.abs(Difference)) | (Difference<0?128:0);
					view.setUint8(offset++, currentSample);
					if (i + 1 > len) break;
					CurSample = (buffer2[i] + 1) * 0x777F;
					Difference2 = CurSample - Difference2;
					currentSample = chooseIndexClosest(SOLTable7bit, Math.abs(Difference2)) | (Difference2<0?128:0);
					view.setUint8(offset++, currentSample);
				}
			}
		}
	}

	// More formats besides 8-bit and 16-bit PCM will be handled later.

	return new Blob([view.buffer], { type: "audio/x-sierra-audio" });
}
