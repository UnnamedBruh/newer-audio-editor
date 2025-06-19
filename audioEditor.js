function muLawCompress(a,t=255){return Math.sign(a)*Math.log1p(t*Math.abs(a))/Math.log1p(t)}function muLawExpand(a,t=255){return Math.sign(a)*(1/t)*(Math.pow(1+t,Math.abs(a))-1)}function muLawQuantize(a,t=256,n=255){const u=muLawCompress(a,n);return muLawExpand(Math.floor((u+1)/2*(t-1))/(t-1)*2-1,n)}

const effects = Object.create(null);

function interpolate(x, y, z) {
	return x + (y - x) * z;
}

function _resampleAudio(buffer, speed, shouldSmooth) {
	const bufferLength = buffer.audioData.length / speed;
	const variable = buffer.audioData instanceof Float32Array ? new Float32Array(Math.round(bufferLength)) : new Float64Array(Math.round(bufferLength));

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
}

effects["quantize"] = function(buffer, bits, which) {
	if (bits >= 32) return;
	bits = bits - 1;
	const precision = Math.pow(2, -bits), n = Math.pow(2, bits);
	const len = buffer.audioData.length, pointer = buffer.audioData;
	const trunc = which === "r" ? Math.round : (which === "t" ? Math.trunc : (which === "f" ? Math.floor : Math.ceil));

	if (which === "fl") {
		if ("f16round" in Math) {
			for (let i = 0; i < len; i++) {
				pointer[i] = Math.f16round(pointer[i]);
			}
		} else {
			alert("Unfortunately, half-precision floats are not supported in your browser. You can switch your browser to the latest version of Google Chrome, Microsoft Edge, Safari or Mozilla Firefox.");
		}
	} else if (which === "mu") {
		for (let i = 0; i < len; i++) {
			pointer[i] = muLawQuantize(pointer[i]);
		}
	} else {
		if (bits === 1) {
			for (let i = 0; i < len; i++) {
				pointer[i] = trunc(pointer[i]);
			}
		} else {
			for (let i = 0; i < len; i++) {
				pointer[i] = trunc(pointer[i] * n) * precision;
			}
		}
	}
}

effects["smooth"] = function(buffer, samples, method) {
	const v = buffer.audioData.length / speed;
	const variable = buffer.audioData instanceof Float32Array ? new Float32Array(Math.round(bufferLength)) : new Float64Array(Math.round(bufferLength));
	
	if (method === "l") {
		let x = 0, y = 0, z = buffer.audioData;
		for (let i = 0; i < v; i++) {
			x = i * speed;
			y = Math.floor(x);
			variable[i] = interpolate(z[y], z[y + samples], x - y);
		}
	} else if (method === "n") {
		let x = 0, y = 0, z = buffer.audioData;
		for (let i = 0; i < v; i++) {
			variable[i] = z[Math.floor(i / samples) * samples];
		}
	} else {
		let acc = 0
		let x = 0, y = 0, z = buffer.audioData, perc = samples / 100;
		for (let i = 0; i < v; i++) {
			acc = interpolate(acc, z[i], perc);
			variable[i] = z[i];
		}
	}

	buffer.audioData = variable;
}
