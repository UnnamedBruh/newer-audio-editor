function encodeLSAC(uint8a = new Uint8Array(0), sampleRate = 48000) {
	const lenOfUint = uint8a.length;
	if (uint8a instanceof Float32Array || uint8a instanceof Float64Array) { // Resample audio data to a valid Uint8Array.
		const arr = new Uint8Array(lenOfUint);
		for (let i = 0; i < lenOfUint; i++) {
			arr[i] = Math.round((uint8a[i] + 1) * 127.5) & 0xFF;
		}
		uint8a = arr;
	}
	const header = new DataView(new ArrayBuffer(12));

	// Insert header, so any applicaion can recognize the format
	header.setUint8(0, 76); // L
	header.setUint8(1, 83); // S
	header.setUint8(2, 65); // A
	header.setUint8(3, 67); // C

	// Since we're packing each four samples into a single byte, this can be calculated with Math.ceil(lenOfUint / 4)
	header.setUint32(4, Math.ceil(lenOfUint / 4));
	header.setUint32(8, sampleRate);

	const audioData = new DataView(new ArrayBuffer(Math.ceil(lenOfUint / 4)));
	const length = Math.ceil(lenOfUint / 4)

	for (let i = 0, j = 0; i < length; i++, j += 4) {
		const diff1 = Math.abs(uint8a[j] - uint8a[j + 1]), diff2 = Math.abs(uint8a[j + 1] - uint8a[j + 2]), diff3 = Math.abs(uint8a[j + 2] - uint8a[j + 3]);
		let bool1, bool2;
		if (diff1 > diff2 && diff1 > diff3) {
			bool1 = false;
			bool2 = true;
		} else if (diff2 > diff1 && diff2 > diff3) {
			bool1 = true;
			bool2 = false;
		} else if (diff3 > diff1 && diff3 > diff2) {
			bool1 = true;
			bool2 = true;
		} else {
			bool1 = false;
			bool2 = false;
		}
		let byte = (uint8a[j] + uint8a[j + 1] + uint8a[j + 2] + uint8a[j + 3]) / 4;
		byte = Math.round(byte / 4);
		byte = byte | (bool1 << 7) | (bool2 << 6);
		audioData.setUint8(i, byte);
	}

	return new Blob([header.buffer, audioData.buffer], { type: "" });
}

function uint8ToFloat32(uint8array) {
	const float32 = new Float32Array(uint8array.length);
	for (let i = 0; i < uint8array.length; i++) {
		float32[i] = (uint8array[i] / 127.5) - 1;
	}
	return float32;
}

async function decodeLSAC(blob) { // This function was written using a generative model, then slightly changed for refining. Perfection is not guaranteed.
	return new Promise(async (resolve, reject) => {
		const arrayBuffer = await blob.arrayBuffer();
		const header = new DataView(arrayBuffer, 0, 12);

		// Validate header
		if (
			header.getUint8(0) !== 76 || // 'L'
			header.getUint8(1) !== 83 || // 'S'
			header.getUint8(2) !== 65 || // 'A'
			header.getUint8(3) !== 67 // 'C'
		) {
			reject(new Error('Invalid LSAC header'));
			return;
		}

		const compressedLength = header.getUint32(4);
		const sampleRate = header.getUint32(8);
		const audioData = new Uint8Array(arrayBuffer, 12, compressedLength);

		// We'll reconstruct the original samples into a Uint8Array with length = compressedLength * 4
		const outputLength = compressedLength * 4;
		let output = new Uint8Array(outputLength);

		for (let i = 0; i < compressedLength; i++) {
			const byte = audioData[i];

			// Extract flags
			const bool1 = (byte & 0x80) !== 0;
			const bool2 = (byte & 0x40) !== 0;

			// Extract base average value (6 bits)
			let avg = byte & 0x3F;

			// Reverse the scaling from encode: avg was rounded((sum of 4 samples) / 4) / 4
			// So, multiply back by 4 = original sample
			avg = avg * 4;

			// Now we reconstruct the 4 samples:
			// Using the bool1, bool2 flags, guess which pair has the biggest difference
			// We'll try to spread the differences around the avg

			// We'll pick some differences to apply:
			const diff = 20; // arbitrary small difference for variation

			// Reconstruct samples (roughly):
			// Indexing j: s0, s1, s2, s3
			// The largest difference between samples is determined by bool1 and bool2:
			// 00 -> no big difference, all samples close to avg
			// 01 -> diff between s0 and s1 is largest
			// 10 -> diff between s1 and s2 is largest
			// 11 -> diff between s2 and s3 is largest

			let s0 = avg;
			let s1 = avg;
			let s2 = avg;
			let s3 = avg;

			if (!bool1 && bool2) {
				// largest diff between s0 and s1
				s0 = avg - diff/2;
				s1 = avg + diff/2;
			} else if (bool1 && !bool2) {
				// largest diff between s1 and s2
				s1 = avg - diff/2;
				s2 = avg + diff/2;
			} else if (bool1 && bool2) {
				// largest diff between s2 and s3
				s2 = avg - diff/2;
				s3 = avg + diff/2;
			}

			// Clamp values to valid range [0, 255]
			output[i * 4] = Math.min(255, Math.max(0, Math.round(s0)));
			output[i * 4 + 1] = Math.min(255, Math.max(0, Math.round(s1)));
			output[i * 4 + 2] = Math.min(255, Math.max(0, Math.round(s2)));
			output[i * 4 + 3] = Math.min(255, Math.max(0, Math.round(s3)));
		}
		resolve({ samples: uint8ToFloat32(output), sampleRate });
	});
}
