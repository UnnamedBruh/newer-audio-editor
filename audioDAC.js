function encodeDAC(buffer, sampleRate, isVariable) {
	if (!(buffer instanceof Float32Array) || typeof sampleRate !== "number") throw new TypeError("The audio buffer is not a Float32Array, or the sampleRate is not a number. Please convert the array and sampleRate."); else {
		let audioBuffer = [new Uint8Array(64)];
		let currentIndex = 0, currentBufferIndex = 0;
		function writeNextData(buffer) {
			let buf = audioBuffer[currentBufferIndex];
			const len = buffer.length;
			for (let i = 0; i < len; i++) {
				buf[currentIndex] = buffer[i];
				currentIndex++;
				if (currentIndex >= 64) {
					currentIndex = 0;
					currentBufferIndex++;
					audioBuffer.push(new Uint8Array(64));
					buf = audioBuffer[currentBufferIndex];
				}
			}
		}
		isVariable = !!isVariable;
		writeNextData(new Uint8Array([68, 65, 67, 32, 86, 49, 32, 32, 0, 0, 0, 0, 0, 0, 0, 0])); // DAC V1  [samplerate][isVariableBits][bitsPerFrameOrSamples, if !isVariableBits]
		audioBuffer[0][8] = sampleRate & 255;
		audioBuffer[0][9] = (sampleRate >> 8) & 255;
		audioBuffer[0][10] = isVariable; // Also ignore this, just because it's not officially implemented yet. Just let others do their own thing for now.
		// The bits differences will always be 4 for now.
		audioBuffer[0][11] = 4;
		audioBuffer[0][12] = (buffer.length/2) & 255;
		audioBuffer[0][13] = ((buffer.length/2) >> 8) & 255;
		audioBuffer[0][14] = ((buffer.length/2) >> 16) & 255;
		audioBuffer[0][15] = (buffer.length/2) >> 24;

		let acc = 0;

		// Now for encoding.
		for (let i = 0; i < buffer.length; i += 2) {
			let a1 = acc;
			acc = a1 - buffer[i];
			if (Math.abs(acc - a1) > 0.0625) acc = Math.sign(acc) * 0.0625;
			let calculatedSample = 0;
			if (a1 < 0) calculatedSample = (-a1 * 255 * 8 + 8) | 0; else calculatedSample = (a1 * 255 * 8) | 0;
			let a2 = acc;
			acc = a2 - buffer[i + 1];
			if (Math.abs(acc - a2) > 0.0625) acc = Math.sign(acc) * 0.0625;
			if (a1 < 0) calculatedSample |= (a2 * 255 * 8 + 8) << 4; else calculatedSample |= (a2 * 255 * 8) << 4;
			writeNextData(new Uint8Array([calculatedSample]));
		}
		return new Blob(audioBuffer).buffer;
	}
}
