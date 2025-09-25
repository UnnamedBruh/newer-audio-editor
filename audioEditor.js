const abs = Math.abs, sqrt = Math.sqrt, sign = Math.sign, cbrt = Math.cbrt, floor = Math.floor, ceil = Math.ceil, log1p = Math.log1p, pow = Math.pow, round = Math.round, tru = Math.trunc;

function muLawCompress(a,t=255){return sign(a)*log1p(t*abs(a))/log1p(t)}function muLawExpand(a,t=255){return sign(a)*(1/t)*(pow(1+t,abs(a))-1)}function muLawQuantize(a,t=256,n=255){const u=muLawCompress(a,n);return muLawExpand(floor((u+1)/2*(t-1))/(t-1)*2-1,n)}

const effects = Object.create(null);

function interpolate(x, y, z) {
	return x + (y - x) * z;
}

function _resampleAudio(buffer, speed, shouldSmooth) {
	const bufferLength = buffer.audioData.length / speed;
	const variable = buffer.audioData instanceof Float32Array ? new Float32Array(round(bufferLength)) : new Float64Array(round(bufferLength));

	let v = Math.round(bufferLength) - 1;
	let integerfunction = Number.isInteger;

	if (shouldSmooth && !Number.isInteger(speed)) {
		let x = 0, y = 0, z = buffer.audioData;
		for (let i = 0; i < v; i++) {
			x = i * speed;
			if (integerfunction(x)) {
				variable[i] = z[x];
			} else {
				y = floor(x);
				variable[i] = interpolate(z[y], z[y + 1], x - y);
			}
		}
	} else {
		let x = 0, y = 0, z = buffer.audioData;
		for (let i = 0; i < v; i++) {
			variable[i] = z[floor(i * speed)];
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

const f16round = Math.f16round;

effects["quantize"] = function(buffer, bits, which) {
	if (bits >= 32) return;
	bits = bits - 1;
	const precision = Math.pow(2, -bits), n = Math.pow(2, bits);
	const len = buffer.audioData.length, pointer = buffer.audioData;
	const trunc = which === "r" ? round : (which === "t" ? tru : (which === "f" ? floor : ceil));

	if (which === "fl") {
		if (f16round) {
			for (let i = 0; i < len; i++) {
				pointer[i] = f16round(pointer[i]);
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
	const v = buffer.audioData.length;
	if (method === "r") {
		let z = buffer.audioData, perc = 1 - samples / 100;
		for (let i = 1; i < v; i++) {
			z[i] = interpolate(z[i], z[i - 1], perc);
		}
	} else if (method === "dyn") { // Much more sophisticated smoothing algorithm
		let z = buffer.audioData, perc = samples / 100, f, p;
		for (let i = 1; i < v; i++) {
			f = z[i]; p = z[i - 1];
			z[i] = interpolate(f, p, perc * pow(1 - abs(f - p), 2));
		}
	} else {
		const variable = buffer.audioData instanceof Float32Array ? new Float32Array(round(v)) : new Float64Array(round(v));

		if (method === "l") {
			let y = 0, z = buffer.audioData;
			let samplesFrac = 1 / samples;
			for (let i = 0; i < v; i++) {
				y = floor(i / samples) * samples;
				variable[i] = interpolate(z[y], z[y + samples] || 0, (i * samplesFrac) % 1);
			}
		} else if (method === "n") {
			let x = 0, y = 0, z = buffer.audioData;
			for (let i = 0; i < v; i++) {
				variable[i] = z[floor(i / samples) * samples];
			}
		} else {
			let acc = 0;
			let z = buffer.audioData, perc = samples / 100;
			for (let i = 0; i < v; i++) {
				acc = interpolate(acc, z[i], perc);
				variable[i] = acc;
			}
		}

		buffer.audioData = variable;
	}
}

effects["distort"] = function(buffer, perc, method) {
	const v = buffer.audioData.length;
	const z = buffer.audioData;

	if (perc === 0) return; else if (perc === 100) {
		if (method === "s") {
			for (let i = 0; i < v; i++) {
				z[i] = sqrt(abs(z[i])) * sign(z[i]);
			}
		} else if (method === "c") {
			for (let i = 0; i < v; i++) {
				z[i] = cbrt(abs(z[i])) * sign(z[i]);
			}
		} else if (method === "sq") {
			let x = 0;
			for (let i = 0; i < v; i++) {
				x = abs(z[i]);
				z[i] = x * x * sign(z[i]);
			}
		} else if (method === "xpo") {
			let x = 0;
			for (let i = 0; i < v; i++) {
				x = abs(z[i]);
				x = pow(x, x);
				z[i] = x * sign(z[i]);
			}
		} else {
			let x = 0;
			for (let i = 0; i < v; i++) {
				x = abs(z[i]);
				z[i] = x / (floor(x * 8) / 8) * sign(z[i]);
				if (z[i] === Infinity) z[i] = 1; else if (z[i] === -Infinity) z[i] = -1;
			}
		}
	} else {
		if (perc === 0) return;
		perc = perc / 100;
		if (method === "s") {
			for (let i = 0; i < v; i++) {
				z[i] = interpolate(z[i], sqrt(abs(z[i])) * sign(z[i]), perc);
			}
		} else if (method === "c") {
			for (let i = 0; i < v; i++) {
				z[i] = interpolate(z[i], cbrt(abs(z[i])) * sign(z[i]), perc);
			}
		} else if (method === "sq") {
			let x = 0;
			for (let i = 0; i < v; i++) {
				x = abs(z[i]);
				z[i] = interpolate(x, x * x * sign(z[i]), perc);
			}
		} else if (method === "xpo") {
			let x = 0;
			for (let i = 0; i < v; i++) {
				x = abs(z[i]);
				x = pow(x, x);
				z[i] = interpolate(z[i], x * sign(z[i]), perc);
			}
		} else {
			let x = 0;
			for (let i = 0; i < v; i++) {
				x = abs(z[i]);
				z[i] = interpolate(x, x / (floor(x * 8) / 8) * sign(z[i]), perc);
				if (z[i] === Infinity) z[i] = 1; else if (z[i] === -Infinity) z[i] = -1;
			}
		}
	}
}

effects["echo"] = function(buffer, volume, echoes, delay, volumeGainer) {
	if (echoes < 1 || volume === 0 || delay < 0 || volumeGainer <= 0) return;
	if (delay === 0) {
		effects["gain"](buffer, 1 + Math.pow(volume * echoes, -volumeGainer));
		return;
	}
	const v = buffer.audioData.length;
	if (volume === volumeGainer && v < echoes * delay) {
		effects["echo_arbr"](buffer, volume, delay);
		return;
	}
	volume = volume * 0.01;
	volumeGainer = volumeGainer * 0.01;
	delay = round(delay * buffer.sampleRate);

	let newData;
	if (!Object.prototype.hasOwnProperty.call(buffer.audioData, "slice")) {
		newData = buffer.audioData instanceof Float32Array ? new Float32Array(round(v)) : new Float64Array(round(v));
		newData.set(buffer.audioData);
	} else {
		newData = buffer.audioData.slice();
	}

	const audioPointer = buffer.audioData;

	let delayAudio = delay;
	let vol = volume;
	let k = 0;

	if (volume === 1 && volumeGainer === 1) {
		for (let i = 0; i < echoes; i++) {
			if (delayAudio > v) break;
			for (let j = delayAudio; j < v; j++, k++) {
				audioPointer[j] += newData[k];
			}
			k = 0;
			delayAudio += delay;
		}
	} else if (volumeGainer === 1) {
		for (let i = 0; i < echoes; i++) {
			if (delayAudio > v) break;
			for (let j = delayAudio; j < v; j++, k++) {
				audioPointer[j] += newData[k] * volume;
			}
			k = 0;
			delayAudio += delay;
		}
	} else {
		for (let i = 0; i < echoes; i++) {
			if (delayAudio > v || vol === 0) break;
			for (let j = delayAudio; j < v; j++, k++) {
				audioPointer[j] += newData[k] * vol;
			}
			k = 0;
			delayAudio += delay;
			vol = vol * volumeGainer;
		}
	}
}

effects["echo_arbr"] = function(buffer, volume, delay) {
	if (volume === 0 || delay < 0) return;
	volume = volume * 0.01;
	if (delay === 0) {
		effects["gain"](buffer, 1 + volume);
		return;
	}
	delay = round(delay * buffer.sampleRate);

	const v = buffer.audioData.length;
	const audioPointer = buffer.audioData;

	let k = 0;

	if (volume === 1) {
		for (let i = delay; i < v; i++) {
			audioPointer[i] += audioPointer[k];
			k++;
		}
	} else {
		for (let i = delay; i < v; i++) {
			audioPointer[i] += audioPointer[k] * volume;
			k++;
		}
	}
}
