const effects = Object.create(null);

function interpolate(x, y, z) {
	return x + (y - x) * z;
}

function _resampleAudio(buffer, speed, shouldSmooth) {
	const bufferLength = buffer.audioData.length / speed;
	const variable = buffer.audioData instanceof Uint8Array ? new Uint8Array(Math.round(bufferLength)) :
		buffer.audioData instanceof Int16Array ? new Int16Array(Math.round(bufferLength)) :
		buffer.audioData instanceof Uint32Array ? new Uint32Array(Math.round(bufferLength)) :
		buffer.audioData instanceof Float32Array ? new Float32Array(Math.round(bufferLength)) :
		new Float64Array(Math.round(bufferLength));

	let v = Math.round(bufferLength) - 1;

	if (shouldSmooth && !Number.isInteger(speed)) {
		let x = 0, y = 0, z = buffer.audioData;
		for (let i = 0; i < v; i++) {
			x = i * speed;
			if (Number.isInteger(x)) {
				variable[i] = z[x];
			} else {
				y = Math.floor(x);
				variable[i] = interpolate(z[y], z[y + 1], x - y);
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

effects["resample"] = function(buffer, targetSampleRate, shouldSmooth) {
	if (targetSampleRate === buffer.sampleRate) return;

	const speed = buffer.sampleRate / targetSampleRate;
	
	_resampleAudio(buffer, speed, shouldSmooth);	
	buffer.sampleRate = targetSampleRate;
}

effects["speed"] = function(buffer, speed, shouldSmooth) {
	if (speed === 1) return;
	_resampleAudio(buffer, speed, shouldSmooth);
}

effects["gain"] = function(buffer, multiplier) {
	if (multiplier === 1) return;
	if (buffer.audioData instanceof Float32Array || buffer.audioData instanceof Float64Array || buffer.audioData instanceof Int16Array) {
		if (multiplier === 0) buffer.audioData.fill(0); else if (multiplier === -1) {
			const len = buffer.audioData.length, data = buffer.audioData;
			for (let i = 0; i < len; i++) {
				data[i] = -data[i];
			}
		} else {
			const len = buffer.audioData.length, data = buffer.audioData;
			for (let i = 0; i < len; i++) {
				data[i] *= multiplier;
			}
		}
	} else {
		const dec = buffer.audioData instanceof Uint8Array ? 128 : 2147483648;
		if (multiplier === 0) buffer.audioData.fill(dec); else if (multiplier === -1) {
			const len = buffer.audioData.length, data = buffer.audioData;
			for (let i = 0; i < len; i++) {
				data[i] = -(data[i] - dec) + dec;
			}
		} else {
			const len = buffer.audioData.length, data = buffer.audioData;
			for (let i = 0; i < len; i++) {
				data[i] = (data[i] - dec) * multiplier + dec;
			}
		}
	}
}
