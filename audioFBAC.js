function fingerprintFBAC(chunk) {
	let hash = 0;
	for (let i = 0; i < chunk.length; i++) {
		hash = (hash * 31 + chunk[i]) >>> 0;
	}
	return hash.toString(16);
}

function encodeFBAC(input = new Uint8Array(0), sampleRate = 48000, framesPerChunk = 64) {
	// Normalize Float32/64 input to Uint8
	if (input instanceof Float32Array || input instanceof Float64Array) {
		const arr = new Uint8Array(input.length);
		for (let i = 0; i < input.length; i++) {
			arr[i] = Math.round((input[i] + 1) * 127.5) & 0xFF;
		}
		input = arr;
	}

	const totalFrames = Math.ceil(input.length / framesPerChunk);
	const uniqueChunks = new Map(); // hash -> { id, chunk }
	const frameRefs = [];

	let chunkId = 0;

	// Step 1: Build unique frame set and index list
	for (let i = 0; i < input.length; i += framesPerChunk) {
		const chunk = input.slice(i, i + framesPerChunk);
		if (chunk.length < framesPerChunk) {
			// Pad with zeros
			const padded = new Uint8Array(framesPerChunk);
			padded.set(chunk);
			chunk.set(padded);
		}

		const hash = fingerprintFBAC(chunk);
		if (!uniqueChunks.has(hash)) {
			uniqueChunks.set(hash, { id: chunkId++, chunk });
		}
		frameRefs.push(uniqueChunks.get(hash).id);
	}

	// Step 2: Prepare buffers
	const headerSize = 12;
	const frameTableSize = frameRefs.length * 2; // 2 bytes per frame ref
	const uniqueFrameCount = uniqueChunks.size;
	const chunkByteSize = framesPerChunk;
	const framePoolSize = uniqueFrameCount * chunkByteSize;

	const totalSize = headerSize + 4 + framePoolSize + frameTableSize; // +4 = uniqueFrameCount

	const buffer = new Uint8Array(totalSize);
	const view = new DataView(buffer.buffer);

	// Step 3: Write header
	view.setUint8(0, 70); // F
	view.setUint8(1, 66); // B
	view.setUint8(2, 65); // A
	view.setUint8(3, 67); // C

	view.setUint32(4, totalSize);     // Total file size
	view.setUint32(8, sampleRate);    // Sample rate

	// Step 4: Write number of unique frames
	view.setUint32(12, uniqueFrameCount); // offset 12

	// Step 5: Write unique frame pool
	let offset = 16;
	const idToChunk = new Array(uniqueFrameCount);

	for (const { id, chunk } of uniqueChunks.values()) {
		idToChunk[id] = chunk;
	}

	for (let i = 0; i < idToChunk.length; i++) {
		buffer.set(idToChunk[i], offset);
		offset += chunkByteSize;
	}

	// Step 6: Write frame reference table
	for (let i = 0; i < frameRefs.length; i++) {
		view.setUint16(offset, frameRefs[i], true); // little-endian
		offset += 2;
	}

	return buffer;
}

function uint8ToFloat32(uint8Array) {
	const floatArray = new Float32Array(uint8Array.length);
	for(let i = 0; i < uint8Array.length; i++) {
		floatArray[i] = (uint8Array[i] / 127.5) - 1;
	}
	return floatArray;
}

function decodeFBAC(buffer) {
	const view = new DataView(buffer.arrayBuffer);
	
	// Step 1: Validate magic bytes "FBAC"
	if (
		view.getUint8(0) !== 70 || // 'F'
		view.getUint8(1) !== 66 || // 'B'
		view.getUint8(2) !== 65 || // 'A'
		view.getUint8(3) !== 67	// 'C'
	) {
		throw new Error("Invalid FBAC header");
	}
	
	const totalSize = view.getUint32(4);
	const sampleRate = view.getUint32(8);
	const uniqueFrameCount = view.getUint32(12);
	
	const headerSize = 16;
	const framesPerChunk = 64; // must match encoder
	
	const chunkByteSize = framesPerChunk;
	const framePoolSize = uniqueFrameCount * chunkByteSize;
	
	// Step 2: Read unique frame chunks
	let offset = headerSize;
	const uniqueChunks = new Array(uniqueFrameCount);
	for (let i = 0; i < uniqueFrameCount; i++) {
		uniqueChunks[i] = buffer.slice(offset, offset + chunkByteSize);
		offset += chunkByteSize;
	}
	
	// Step 3: Read frame reference table (remaining bytes)
	const frameRefsCount = (totalSize - offset) / 2; // 2 bytes per frame ref
	const frameRefs = new Uint16Array(frameRefsCount);
	
	for (let i = 0; i < frameRefsCount; i++) {
		frameRefs[i] = view.getUint16(offset, true);
		offset += 2;
	}
	
	// Step 4: Reconstruct full output by concatenating frames in order
	const outputLength = frameRefsCount * chunkByteSize;
	const output = new Uint8Array(outputLength);
	
	for (let i = 0; i < frameRefsCount; i++) {
		const chunkId = frameRefs[i];
		output.set(uniqueChunks[chunkId], i * chunkByteSize);
	}
	
	return {
		sampleRate,
		framesPerChunk,
		audioData: uint8ToFloat32(output)
	};
}
