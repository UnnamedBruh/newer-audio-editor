const effects = Object.create(null);

function interpolate(x, y, z) {
	return x + (y - x) * z;
}

effects["resample"] = function(buffer, targetSampleRate, shouldSmooth) {
	const speed = targetSampleRate / buffer.sampleRate;
	const bufferLength = buffer.audioData.length / speed;
	const variable = buffer.audioData instanceof Uint8Array ? new Uint8Array(Math.round(bufferLength)) :
		buffer.audioData instanceof Int16Array ? new Int16Array(Math.round(bufferLength)) :
		buffer.audioData instanceof Uint32Array ? new Uint32Array(Math.round(bufferLength)) :
		buffer.audioData instanceof Float32Array ? new Float32Array(Math.round(bufferLength)) :
		new Float64Array(Math.round(bufferLength));

	let v = Math.floor(bufferLength);

	buffer.sampleRate = targetSampleRate;

	if (shouldSmooth && !Number.isInteger(speed)) {
		let x = 0, y = 0, z = buffer.audioData;
		for (let i = 0; i < v; i++) {
			x = i * speed;
			if (Number.isInteger(x)) {
				variable[i] = z[x];
			} else {
				y = Math.floor(x);
				variable[i] = interpolate(z[y], z[y + 1], x);
			}
		}
	} else {
		let x = 0, y = 0, z = buffer.audioData;
		for (let i = 0; i < v; i++) {
			variable[i] = z[Math.floor(i * speed)];
		}
	}

	buffer.audioData = variable;
}
