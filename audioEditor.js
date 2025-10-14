const abs = Math.abs, sqrt = Math.sqrt, sign = Math.sign, cbrt = Math.cbrt, floor = Math.floor, ceil = Math.ceil, log1p = Math.log1p, pow = Math.pow, round = Math.round, tru = Math.trunc, rand = Math.random, sin = Math.sin;

const muLawCache = Object.create(null);

function muLawCompress(a,t=255){return sign(a)*log1p(t*abs(a))/log1p(t)}function muLawExpand(a,t=255){return sign(a)*(1/t)*(pow(1+t,abs(a))-1)}function muLawQuantize(a,t=256,n=255){const x=muLawCache[a];if(x!==undefined)return x;const u=muLawCompress(a,n);const r=muLawExpand(floor((u+1)/2*(t-1))/(t-1)*2-1,n);muLawCache[a]=r;return r}

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
		effects["gain"](buffer, 1 + pow(volume * echoes, -volumeGainer));
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

effects["noise"] = function(buffer, noiseType, volume, isAlgorithmistic) {
	if (volume === 0) return;
	volume = volume * 0.02;
	const len = buffer.audioData.length, data = buffer.audioData;
	if (noiseType === "wn") {
		if (volume === 1) {
			for (let i = 0; i < len; i++) {
				data[i] += rand() - 0.5;
			}
		} else {
			for (let i = 0; i < len; i++) {
				data[i] += (rand() - 0.5) * volume;
			}
		}
	}
	if (isAlgorithmistic) {
		if (noiseType === "bn") { // GPT-5.0 Mini wrote this implementation, but I adapted it to this function's standards.
			// Algorithmistic brown: cumulative sum of small white noise steps
			let last = 0;
			const step = 0.02;
			for (let i = 0; i < len; i++) {
				last += (rand() - 0.5) * step;
				last = last < -1 ? -1 : last > 1 ? 1 : last; // clamp
				data[i] += last * volume;
			}
		} else if (noiseType === "pn") {
			// https://whoisryosuke.com/blog/2025/generating-pink-noise-for-audio-worklets (algorithm is directly copied-and-pasted, then implemented here. I do NOT write, or claim to have written the marked section.)
			volume *= 0.5;
			let b0, b1, b2, b3, b4, b5, b6, pink, white;
			b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0;
			if (volume === 1) {
				for (let i = 0; i < len; i++) {
					white = rand(); 
					b0 = 0.99886 * b0 + white * 0.0555179; // Start mark
					b1 = 0.99332 * b1 + white * 0.0750759;
					b2 = 0.969 * b2 + white * 0.153852;
					b3 = 0.8665 * b3 + white * 0.3104856;
					b4 = 0.55 * b4 + white * 0.5329522;
					b5 = -0.7616 * b5 - white * 0.016898;
					pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
					b6 = white * 0.115926; // End mark
					data[i] += pink;
				}
			} else {
				for (let i = 0; i < len; i++) {
					white = rand();
					b0 = 0.99886 * b0 + white * 0.0555179;
					b1 = 0.99332 * b1 + white * 0.0750759;
					b2 = 0.969 * b2 + white * 0.153852;
					b3 = 0.8665 * b3 + white * 0.3104856;
					b4 = 0.55 * b4 + white * 0.5329522;
					b5 = -0.7616 * b5 - white * 0.016898;
					pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
					b6 = white * 0.115926;
					data[i] += pink * volume;
				}
			}
		}
	} else {
		if (noiseType === "bn" || noiseType === "pn") {
			const multiplier = (noiseType === "pn" ? 3 : 10) * 2;
			let max = (rand() * multiplier) | 0, currentRandom = rand() - 0.5;
			if (volume === 1) {
				for (let i = 0; i < len; i++) {
					data[i] += currentRandom;
					if (i > max) max += (abs((currentRandom = rand() - 0.5)) * multiplier) | 0;
				}
			} else {
				for (let i = 0; i < len; i++) {
					data[i] += currentRandom * volume;
					if (i > max) max += (abs((currentRandom = rand() - 0.5)) * multiplier) | 0;
				}
			}
		}
	}
}

effects["reverse"] = function(buffer) {
	buffer.audioData.reverse();
}

effects["repeat"] = function(buffer, times) {
	const len = buffer.audioData.length;
	const pointer = buffer.audioData;
	if (times <= 0) {
		buffer.audioData = new Float32Array([]);
		return;
	}
	if (times === 1 || len === 0) return;
	let newData;
	if (times < 1 && Object.prototype.hasOwnProperty.call(pointer, "slice")) {
		newData = buffer.audioData.slice(0, times * len);
	} else {
		newData = new Float32Array(len * times);
		const newLen = newData.length;
		const ti = floor(times);
		for (let i = 0; i < ti; i++) {
			newData.set(pointer, i * len);
		}
		if (ti !== times) { // Fill in the end gaps
			newData.set(pointer.subarray(0, floor((times - ti) * len)), ti * len);
		}
	}
	buffer.audioData = newData;
}

// Old code; this was really quirky and unstable, since I couldn't grasp the idea of a flanger well. :/
/*effects["chorus"] = function(buffer, volume, chorusFlange, distance) {
	if (volume === 0 || chorusFlange === 0) return;
	const len = buffer.audioData.length;
	volume = volume * 0.01;

	let newData;
	if (!Object.prototype.hasOwnProperty.call(buffer.audioData, "slice")) {
		newData = buffer.audioData instanceof Float32Array ? new Float32Array(round(len)) : new Float64Array(round(len));
		newData.set(buffer.audioData);
	} else {
		newData = buffer.audioData.slice();
	}

	const sampleRate = buffer.sampleRate;
	const pi = Math.PI;

	const audioPointer = buffer.audioData;
	let fl, trunc, final;

	chorusFlange *= 2;
	for (let i = 0; i < len; i++) {
		fl = i + sin(i * pi * chorusFlange) * distance;
		if (!(i % 24000)) console.log(fl, i);
		trunc = tru(fl);
		final = interpolate(newData[i], newData[trunc], abs(fl - trunc) % 1);
		if (!isNaN(final)) audioPointer[i] += final * volume;
	}
}*/

// New code, refactored by GPT-5.0 Mini.
effects["chorus"] = function(buffer, volume = 100, rate = 1, depth = 0.003, antiAliasing = true) {
	if (volume === 0) return;

	const audioData = buffer.audioData;
	const sampleRate = buffer.sampleRate;
	const len = audioData.length;

	const dryMix = 0.3;  // original signal
	const wetMix = 0.7;  // modulated signal

	const modulated = new Float32Array(len);

	// Phase for sine LFO
	let phase = Math.PI / 2;
	const pi = 2 * Math.PI;
	const phaseIncrement = pi * rate / sampleRate;

	depth *= sampleRate; // An optimization to reduce computation (added by me)

	let delaySamples, readIndex, delaySample, int;

	if (antiAliasing) {
		for (let i = 0; i < len; i++) {
			// LFO modulates the delay
			delaySamples = sin(phase) * depth; // non-integer delay
			readIndex = i - delaySamples;

			int = delaySamples | 0;

			// Safe read: use original if out of bounds
			delayedSample = readIndex >= 0 ? interpolate(audioData[int], audioData[int + 1], readIndex % 1) : 0;

			// Mix dry + wet
			modulated[i] = dryMix * audioData[i] + (wetMix + 0.05 * sin(phase)) * delayedSample;

			// Increment phase
			phase += phaseIncrement;
			if (phase > pi) phase -= pi;
		}
	} else {
		for (let i = 0; i < len; i++) {
			// LFO modulates the delay
			delaySamples = (sin(phase) * depth) | 0; // integer delay
			readIndex = i - delaySamples;

			// Safe read: use original if out of bounds
			delayedSample = readIndex >= 0 ? audioData[readIndex] : 0;

			// Mix dry + wet
			modulated[i] = dryMix * audioData[i] + (wetMix + 0.05 * sin(phase)) * delayedSample;

			// Increment phase
			phase += phaseIncrement;
			if (phase > pi) phase -= pi;
		}
	}

	// Apply volume and copy back to buffer (the original line was optimized by me)
	audioData.set(modulated);

	volume *= 0.01;
	for (let i = 0; i < len; i++) {
		audioData[i] *= volume;
	}
};

//effects["reverb"] = function(buffer, 
