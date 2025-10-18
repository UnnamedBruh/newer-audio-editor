function encodeDAC(buffer, sampleRate, isVariable) {
	if (!(buffer instanceof Float32Array) || typeof sampleRate !== "number") throw new TypeError("The audio buffer is not a Float32Array, or the sampleRate is not a number. Please convert the array and sampleRate."); else {
		let audioBuffer = [new Uint8Array(2048)];
		let currentIndex = 0, currentBufferIndex = 0;
		function writeNextData(buffer) {
			let buf = audioBuffer[currentBufferIndex];
			const len = buffer.length;
			for (let i = 0; i < len; i++) {
				buf[currentIndex] = buffer[i];
				currentIndex++;
				if (currentIndex >= 2048) {
					currentIndex = 0;
					currentBufferIndex++;
					audioBuffer.push(new Uint8Array(2048));
					buf = audioBuffer[currentBufferIndex];
				}
			}
		}
		writeNextData(new Uint8Array([68, 65, 67, 32, 86, 49, 32, 32, 0, 0, 0, 4, 0, 0, 0, 0])); // DAC V1  [samplerate][isVariableBits][bitsPerFrameOrSamples, if !isVariableBits]
		audioBuffer[0][8] = sampleRate & 255;
		audioBuffer[0][9] = (sampleRate >> 8) & 255;
		audioBuffer[0][10] = isVariable; // Also ignore this, just because it's not officially implemented yet. Just let others do their own thing for now.
		// The bits differences will always be 5 for now. This is quite difficult to decode, but it works. or does it?
		audioBuffer[0][12] = buffer.length & 255;
		audioBuffer[0][13] = (buffer.length >> 8) & 255;
		audioBuffer[0][14] = (buffer.length >> 16) & 255;
		audioBuffer[0][15] = buffer.length >> 24;

		// Now for encoding.
		audioBuffer
	}
}
