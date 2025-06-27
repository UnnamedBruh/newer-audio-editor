function encodeSAAC(uint8a = new Uint8Array(0), sampleRate = 48000) { // Sample-rate Adapting Audio Codec
	const lenOfUint = uint8a.length;
	if (uint8a instanceof Float32Array || uint8a instanceof Float64Array) { // Resample audio data to a valid Uint8Array.
		const arr = new Uint8Array(lenOfUint);
		for (let i = 0; i < lenOfUint; i++) {
			arr[i] = Math.round((uint8a[i] + 1) * 127.5) & 0xFF;
		}
		uint8a = arr;
	}
	const header = new DataView(new ArrayBuffer(16));

	// Insert header, so any applicaion can recognize the format
	header.setUint8(0, 83); // S
	header.setUint8(1, 65); // A
	header.setUint8(2, 65); // A
	header.setUint8(3, 67); // C

	// We don't know how long the audio would be, so we fill the file size in later
	header.setUint32(8, sampleRate);

	// We don't know how many segments of the audio with different sample rates are
}
