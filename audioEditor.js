const abs = Math.abs, sqrt = Math.sqrt, sign = Math.sign, cbrt = Math.cbrt, floor = Math.floor, ceil = Math.ceil, log1p = Math.log1p, pow = Math.pow, round = Math.round, tru = Math.trunc, rand = Math.random, sin = Math.sin, cos = Math.cos;

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
	if (multiplier === 0) {
		buffer.audioData.fill(0);
		// or manually set the whole buffer to 0, but modern engines can significantly optimize .fill very well.
	} else if (multiplier === -1) {
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
		} else if (method === "hi") {
			let y = 0, a = 0;
			for (let i = 0; i < v; i++) {
				y = z[i];
				if (y > a) z[i] = 1; else if (y < a) z[i] = -1; else z[i] = 0;
				a = y;
			}
		} else if (method === "sin") {
			const p = Math.PI * 0.5;
			for (let i = 0; i < v; i++) {
				z[i] = sin(z[i] * p);
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
		} else if (method === "hi") {
			let y = 0, a = 0;
			for (let i = 0; i < v; i++) {
				y = z[i];
				if (y > a) z[i] = interpolate(z[i], 1, perc); else if (y < a) interpolate(z[i], -1, perc); else z[i] = interpolate(z[i], 0, perc);
				a = y;
			}
		} else if (method === "sin") {
			const p = Math.PI * 0.5;
			for (let i = 0; i < v; i++) {
				z[i] = interpolate(z[i], sin(z[i] * p), perc);
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

let blackNoiseTable = new Float64Array();
let timesNeededForRefresh = 1;

function generateTablesBlackNoise() {
	timesNeededForRefresh = exporters.length;
	let array = [];
	let noise = 0;
	const l = exporters[0].audioData.length;
	const rate = exporters[0].sampleRate;
	for (let i = 0; i < l; i += noise) {
		array.push((noise = rand()*39*rate));
	}
	blackNoiseTable = new Float64Array(array);
}

effects["noise"] = function(buffer, noiseType, volume, isAlgorithmistic) {
	if (volume === 0) return;
	volume = volume * 0.02;
	const len = buffer.audioData.length, data = buffer.audioData;
	const rate = buffer.sampleRate;
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
	} else if (noiseType === "vn") {
		volume *= 0.5;
		if (volume === 1) {
			let p = 0, j = 0;
			for (let i = 0; i < len; i++) {
				p = rand() - 0.5;
				data[i] += (p - j);
				j = p;
			}
		} else {
			let p = 0, j = 0;
			for (let i = 0; i < len; i++) {
				p = rand() - 0.5;
				data[i] += (p - j) * volume;
				j = p;
			}
		}
	} else if (noiseType === "bln") {
		volume *= 0.25;
		let p = 0, j = 0;
		for (let i = 0; i < len; i++) {
			p = rand() - 0.5;
			data[i] += ((p - j) + p) * volume;
			j = p;
		}
	} else if (noiseType === "black") { // My creative spin on black noise!
		volume *= 0.5;
		let last = 0;
		let step = 0.0006;
		let inc = 0;
		timesNeededForRefresh--;
		if (timesNeededForRefresh === 0) {
			generateTablesBlackNoise();
		}
		//let burst = rand()*rate*39; // Maximum time before burst of energy is 39 seconds
		let burst = blackNoiseTable[0];
		let burstIndex = 0;
		for (let i = 0; i < len; i++) {
			inc += (rand() - 0.5) * step;
			inc = inc > 0.005 ? 0.005 : inc < -0.005 ? -0.005 : inc;
			last += inc;
			if (last>1) {
				last = 1;
				inc = 0;
			} else if (last<-1) {
				last = -1;
				inc = 0;
			}
			data[i] += last * volume;
			if (burst < i) {
				//burst += rand()*rate*39;
				burst += blackNoiseTable[++burstIndex];
				step += rand() * 0.003;
			}
			if (step > 0.0006) step -= 1/rate * 0.000579; else if (step < 0.0006) step = 0.0006;
		}
	}
	if (isAlgorithmistic || noiseType === "gr" || noiseType === "green") {
		if (noiseType === "bn" || noiseType === "pnacc" || noiseType === "orn") { // GPT-5.0 Mini wrote this implementation, but I adapted it to this function's standards.
			volume *= 0.5;
			// Algorithmistic brown: cumulative sum of small white noise steps
			let last = 0;
			const step = (noiseType === "bn") ? 0.2 : (noiseType === "pnacc" ? 0.34 : 0.06);
			for (let i = 0; i < len; i++) {
				last += (rand() - 0.5) * step;
				last = last < -1 ? -1 : last > 1 ? 1 : last; // clamp
				data[i] += last * volume;
			}
		} else if (noiseType === "gr") { // My own spin on this: gray noise
			volume *= 0.25;
			let last = 0;
			const step = 0.3;
			let p = 0, j = 0;
			const vol2 = volume * 0.5;
			for (let i = 0; i < len; i++) {
				last += (rand() - 0.5) * step;
				last = last < -1 ? -1 : last > 1 ? 1 : last; // clamp
				data[i] += last * volume;
				p = rand() - 0.5;
				data[i] += ((p - j) + p) * vol2;
				j = p;
			}
		} else if (noiseType === "green") { // My own spin on this: green noise
			if (volume === 1) {
				let p = data[0] = rand();
				for (let i = 1; i < len; i++) {
					let l = rand();
					let e = abs(p - l);
					while (e < 0.05 || e > 0.13) { // The difference can't be small, but it also can't be large either.
						l = rand();
						e = abs(p - l);
					}
					data[i] += l - 0.5;
					p = l;
				}
			} else {
				let p = data[0] = rand();
				for (let i = 1; i < len; i++) {
					let l = rand();
					let e = abs(p - l);
					while (e < 0.05 || e > 0.13) { // The difference can't be small, but it also can't be large either.
						l = rand();
						e = abs(p - l);
					}
					data[i] += (l - 0.5) * volume;
					p = l;
				}
			}
		} else if (noiseType === "pn") {
			// https://whoisryosuke.com/blog/2025/generating-pink-noise-for-audio-worklets (algorithm is directly copied-and-pasted, then implemented here. I do NOT write, or claim to have written the marked section.)
			volume *= 0.11;
			let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0, pink=0, white=0;
			if (volume === 1) {
				for (let i = 0; i < len; i++) {
					white = 2 * rand() - 1; 
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
					white = 2 * rand() - 1;
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
		if (noiseType === "bn" || noiseType === "pn" || noiseType === "pnacc" || noiseType === "orn") {
			const multiplier = (noiseType === "pn" || noiseType === "pnacc" ? 3 : (noiseType === "orn" ? 33 : 10)) * 2;
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

effects["experimentalnoise"] = function(buffer, noiseType, volume, whenToJumpInSamples, jumpValue, freq3) {
	if (volume === 0) return;
	volume = volume * 0.01;
	const len = buffer.audioData.length, data = buffer.audioData;
	if (noiseType === "sah") { // Varied 8-bit static. Code below matches sample-and-hold noise, GPT-5.2 claims.
		// Very much inspired by https://www.youtube.com/watch?v=07y0PJlR4P8&t=78s
		if (volume === 1) {
			for (let i = 0; i < len; i += whenToJumpInSamples) {
				const when = i + whenToJumpInSamples;
				const r = rand() - 0.5 - (jumpValue*0.5);
				for (let j = i; j < when; j++) {
					data[j] += r + rand() * jumpValue;
				}
			}
		} else {
			jumpValue *= volume;
			for (let i = 0; i < len; i += whenToJumpInSamples) {
				const when = i + whenToJumpInSamples;
				const r = ((rand() - 0.5)*volume) - (jumpValue*0.5);
				for (let j = i; j < when; j++) {
					data[j] += r + rand() * jumpValue;
				}
			}
		}
	} else if (noiseType === "triper") { // Triple-frequency "Perlin" static, the code ripped the "freq1", "freq2" and "freq3" code from https://gpfault.net/posts/perlin-sound.txt.html. I do not claim to have written the original code posted on that website.
		// I can only say that I altered the code to support volume adjustments, and work with float32 values instead of signed 16-bit integers.
function fade(t) {
	return t*t*t*(t*(t*6.0 - 15.0) + 10.0);
}
			let rand_noise = new Float32Array(44100);
let have_noise = false;
function grad(p) {
	if (!have_noise) {
		for (let i = 0; i < rand_noise.length; ++i) {
			rand_noise[i] = rand();
		}
		have_noise = true;
	}
	let v = rand_noise[floor(p) % rand_noise.length];
	return v > 0.5 ? 1.0 : -1.0;
}

function noise(p) {
	let p0 = floor(p);
	let p1 = p0 + 1.0;

	let t = p - p0;
	let fade_t = fade(t);

	let g0 = grad(p0);
	let g1 = grad(p1);

	return (1.0 - fade_t)*g0*(p - p0) + fade_t*g1*(p - p1);
}
		const duration_seconds = len/buffer.sampleRate;
		const sampling_rate_hz = buffer.sampleRate;
		function fil(d) {return 127 - d*0.5;}
		const freq = fil(whenToJumpInSamples); // In Midinotes
		const freq2 = fil(jumpValue); // also in Midinotes
		freq3 = fil(freq3);
if (volume === 1) {for (let sample_idx = 0; sample_idx < len; ++sample_idx) {
    let x1 = sample_idx / freq;
    let x2 = sample_idx / freq2;
    let x3 = sample_idx / freq3;
    let n = noise(x1);
    let n2 = noise(x2);
    let n3 = noise(x3);
	let s = 0.5 * n + 0.3 * n2 + 0.2 * n3;
	data[sample_idx] += s;
}} else {for (let sample_idx = 0; sample_idx < len; ++sample_idx) {
    let x1 = sample_idx / freq;
    let x2 = sample_idx / freq2;
    let x3 = sample_idx / freq3;
    let n = noise(x1);
    let n2 = noise(x2);
    let n3 = noise(x3);
	let s = 0.5 * n + 0.3 * n2 + 0.2 * n3;
	data[sample_idx] += s*volume;
}}
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

// New code, refactored by GPT-5.0 Mini.
effects["chorus"] = function(buffer, volume = 100, rate = 1, depth = 0.003, antiAliasing = true) {
	if (volume === 0) return;

	const audioData = buffer.audioData;
	const sampleRate = buffer.sampleRate;
	const len = audioData.length;

	const dryMix = 0.5;  // original signal
	const wetMix = volume * 0.01;  // modulated signal

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
			delaySamples = (sin(phase) * 0.5 + 0.5) * depth; // non-integer delay
			readIndex = i - delaySamples;

			int = delaySamples | 0;

			// Safe read: use original if out of bounds
			delayedSample = readIndex >= 0 ? interpolate(audioData[int], audioData[int + 1], readIndex % 1) : 0;

			// Mix dry + wet
			modulated[i] = dryMix * audioData[i] + wetMix * delayedSample;

			// Increment phase
			phase += phaseIncrement;
			if (phase > pi) phase -= pi;
		}
	} else {
		for (let i = 0; i < len; i++) {
			// LFO modulates the delay
			delaySamples = ((sin(phase) * 0.5 + 0.5) * depth) | 0; // integer delay
			readIndex = i - delaySamples;

			// Safe read: use original if out of bounds
			delayedSample = readIndex >= 0 ? audioData[readIndex] : 0;

			// Mix dry + wet
			modulated[i] = dryMix * audioData[i] + wetMix * delayedSample;

			// Increment phase
			phase += phaseIncrement;
			if (phase > pi) phase -= pi;
		}
	}

	// Apply volume and copy back to buffer (the original line was optimized by me)
	audioData.set(modulated);
};

//effects["reverb"] = function(buffer, 

effects["difference"] = function(buffer, interpolation = 1, step = -1) {
	if (interpolation === 0 || step === 0) return;
	interpolation *= 0.01;
	const len = buffer.audioData.length;
	const pointer = buffer.audioData;
	if (step === -1) {
		if (interpolation === -1) {
			let prev = 0;
			for (let i = 1; i < len; i++) {
				pointer[i] -= pointer[prev];
				prev = i;
			}
		} else if (interpolation === 1) {
			let x = new Float32Array(len);
			let prev = 0;
			for (let i = 1; i < len; i++) {
				x[i] = pointer[i] - pointer[prev];
				prev = i;
			}
			buffer.audioData = x;
		} else {
			let x = new Float32Array(len);
			let prev = 0;
			for (let i = 1; i < len; i++) {
				x[i] = interpolate(pointer[i], pointer[i] - pointer[prev], interpolation);
				prev = i;
			}
			buffer.audioData = x;
		}
	} else {
		if (interpolation === -1) {
			let prev = 0;
			let acc = 0;
			for (let i = 1; i < len; i++) {
				acc = interpolate(acc, pointer[prev], step);
				pointer[i] -= acc;
				prev = i;
			}
		} else if (interpolation === 1) {
			let x = new Float32Array(len);
			let prev = 0;
			let acc = 0;
			for (let i = 1; i < len; i++) {
				acc = interpolate(acc, pointer[prev], step);
				x[i] = pointer[i] - acc;
				prev = i;
			}
			buffer.audioData = x;
		} else {
			let x = new Float32Array(len);
			let prev = 0;
			let acc = 0;
			for (let i = 1; i < len; i++) {
				acc = interpolate(acc, pointer[prev], step);
				x[i] = interpolate(pointer[i], pointer[i] - acc, interpolation);
				prev = i;
			}
			buffer.audioData = x;
		}
	}
}

effects["normalize"] = function(exporter) {
	const pointer = exporter.audioData;
	const len = pointer.length;
	if (len === 0) return;
	
	let max = pointer[0], n = 0;
	for (let i = 1; i < len; i++) {
		n = abs(pointer[i] || 0);
		if (n > max) max = n;
	}
	max = (1 / max) * 0.9;
	for (let i = 0; i < len; i++) {
		pointer[i] *= max;
	}
}

effects["tvnormalize"] = function(exporter) {
	const pointer = exporter.audioData;
	const len = pointer.length;
	if (len === 0) return;
	let i = 0;

	const chunkSize = 512;
	const chunkSizeDiv = 1 / chunkSize;
	const trackVolume = new Float32Array(ceil(len / chunkSize) * chunkSize);
	const trackLen = trackVolume.length;

	const min = Math.min;

	const sumDivisor = 1 / (chunkSize * 0.25);
	let c = false;

	for (let i = 0, k = 0; i < trackLen; i += chunkSize, k++) {
		const goUntil = min(i + chunkSize, trackLen);
		let sum = 0;
		let j = i;
		for (; j < goUntil; j++) {
			sum += abs(pointer[j]);
			if (pointer[j] === 0) {
				j++;
				if (pointer[j] === 0) {
					j++;
					if (!sum) sum = 1; // Non-zero the sum to minimize distortion
				}
			}
		}
		sum *= sumDivisor;
		trackVolume[k] = sum;
		if (c && trackVolume[k-1] < sum) trackVolume[k-1] = interpolate(trackVolume[k-1], sum, 0.5); // Minimize distortion
		c = true;
	}
	i = 0;

	for (; i < len; i++) {
		const x = i * chunkSizeDiv;
		if ((x | 0) !== x) {
			let inter = interpolate(trackVolume[floor(x)], trackVolume[ceil(x)] || 0, x % 1);
			if (!isFinite(inter) || isNaN(inter) || inter === 0) inter = 2;
			pointer[i] /= inter;
		} else {
			let inter = trackVolume[x];
			if (!isFinite(inter) || isNaN(inter) || inter === 0) inter = 2;
			pointer[i] /= inter;
		}
	}
}

effects["fade"] = function(exporter, direction = "in", easing = "l") {
	const pointer = exporter.audioData;
	const len = pointer.length;
	if (len === 0) return;

	const invLen = 1 / len;

	if (easing === "l") { // linear
		if (direction === "in") {
			for (let i = 0; i < len; i++) {
				pointer[i] *= i * invLen;
			}
		} else if (direction === "out") {
			for (let i = 0; i < len; i++) {
				pointer[i] *= (len - i) * invLen;
			}
		}
	} else if (easing === "eout") { // ease out
		const pi2 = Math.PI / 2 / len;
		if (direction === "in") {
			for (let i = 0; i < len; i++) {
				pointer[i] *= sin(i * pi2);
			}
		} else if (direction === "out") {
			for (let i = 0; i < len; i++) {
				pointer[i] *= 1 - sin(i * pi2);
			}
		}
	} else if (easing === "ein") { // ease in
		const pi2 = Math.PI / 2 / len;
		if (direction === "in") {
			for (let i = 0; i < len; i++) {
				pointer[i] *= 1 - cos(i * pi2);
			}
		} else if (direction === "out") {
			for (let i = 0; i < len; i++) {
				pointer[i] *= cos(i * pi2);
			}
		}
	} else if (easing === "cub") { // cubic
		if (direction === "in") {
			for (let i = 0; i < len; i++) {
				pointer[i] *= pow(i * invLen, 3)
			}
		} else if (direction === "out") {
			for (let i = 0; i < len; i++) {
				pointer[i] *= 1 - pow(i * invLen, 3);
			}
		}
	}
}

effects["reverb"] = async function(exporter, reverbTime, reverbDecay, dryGain2, wetGain2, whichSystem, damp, chanceOfSpike) {
	dryGain2 *= 0.01;
	wetGain2 *= 0.01;
	// Create reverb impulse response, written by Claude Sonnet 4.5
	function createReverbImpulse(context, duration, decay, whichSystem, damp = 0.2, chanceOfSpike = 4) {
		const sampleRate = context.sampleRate;
		const length = sampleRate * duration;
		const impulse = context.createBuffer(1, length, sampleRate);
		const data = impulse.getChannelData(0);
		if (whichSystem === "d") {
			for (let i = 0; i < length; i++) {
				// Create decaying noise
				const n = Math.random() * 2 - 1;
				data[i] = n * Math.pow(1 - i / length, decay);
			}
		} else if (whichSystem === "real") { // This part is written by ChatGPT 5.0 Mini
			let lastSample = 0;
			const dampBegin = damp;
			let kk = 0;
			for (let i = 0; i < length; i++) {
				// Create decaying noise
				let n = Math.random() * 2 - 1;
				kk = 1 - i / length;
				n = n * Math.pow(kk, decay);
				lastSample = lastSample + damp * (n - lastSample);
				damp = (1-(i*0.5)/length)*dampBegin;
				data[i] = lastSample;
			}
		} else if (whichSystem === "realspike") { // This part was written by ChatGPT 5.0 Mini, but it is slightly altered by me. (I simulated spikes.)
			function y(y) {return y * Math.log(y) * Math.log10(y * 2);}
			let lastSample = 0;
			const estimatedEndOfSpike = y(length);
			const dampBegin = damp;
			let kk = 0;
			for (let i = 0; i < length; i++) {
				// Create decaying noise
				let n = Math.random() * 2 - 1;
				kk = 1 - i / length;
				n = n * Math.pow(kk, decay);
				lastSample = lastSample + damp * (n - lastSample);
				damp = (1-(i*0.5)/length)*dampBegin;
				let curr = lastSample;
				if (i > chanceOfSpike && i < estimatedEndOfSpike) {
					curr += Math.sign(curr) * Math.cbrt(curr);
					chanceOfSpike += chanceOfSpike * (Math.random() + 0.5);
				}
				data[i] = curr;
			}
		} else if (whichSystem === "realrapid") { // This part was duplicated from the snippet inside the "real" branch, except the frequency of the IR decreases a lot quicker.
			let lastSample = 0;
			const dampBegin = damp;
			let kk = 0;
			for (let i = 0; i < length; i++) {
				// Create decaying noise
				let n = Math.random() * 2 - 1;
				kk = 1 - i / length;
				n = n * Math.pow(kk, decay);
				lastSample = lastSample + damp * (n - lastSample);
				damp = (1-sqrt(i/length))*dampBegin;
				data[i] = lastSample;
			}
		}

		return impulse;
	}

	// Main render function, also written by Claude Sonnet 4.5 (slightly modified)
	async function renderWithReverb(sourceBuffer) {
		try {
			const duration = sourceBuffer.duration;
			const sampleRate = sourceBuffer.sampleRate;

			// Create offline context
			const offlineContext = new OfflineAudioContext(
				1,
				sampleRate * duration,
				sampleRate
			);

			// Create source
			const source = offlineContext.createBufferSource();
			source.buffer = sourceBuffer;

			// Create reverb
			const convolver = offlineContext.createConvolver();
			convolver.buffer = createReverbImpulse(offlineContext, reverbTime, reverbDecay, whichSystem, damp, chanceOfSpike);

			// Create dry and wet gains
			const dryGain = offlineContext.createGain();
			const wetGain = offlineContext.createGain();
			dryGain.gain.value = dryGain2;
			wetGain.gain.value = wetGain2;

			// Connect the graph
			source.connect(dryGain);
			dryGain.connect(offlineContext.destination);

			source.connect(convolver);
			convolver.connect(wetGain);
			wetGain.connect(offlineContext.destination);

			// Start source
			source.start(0);
			// Render
			renderedBuffer = await offlineContext.startRendering();

			exporter.audioData = renderedBuffer.getChannelData(0);
		} catch (error) {
			alert(`There is an error with the reverb rendering process.\n\n${error.stack}`);
			console.error(error);
		}
	}

	const bb = audioContext.createBuffer(1, exporter.audioData.length, exporter.sampleRate);
	bb.copyToChannel(exporter.audioData, 0);

	await renderWithReverb(bb);
}

effects["sine"] = function(exporters, midiNote, volume) {
	const tau = Math.PI * 2;
	const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
	const len = exporters.audioData.length;
	const pointer = exporters.audioData;
	volume *= 0.01;
	const dt = 1 / exporters.sampleRate;
	if (volume === 0 || len < 2) return;

	const c = tau * freq * dt;

	if (volume === 1) {
		for (let i = 0; i < len; i++) {
			pointer[i] += sin(c * i);
		}
	} else {
		for (let i = 0; i < len; i++) {
			pointer[i] += sin(c * i) * volume;
		}
	}
}

effects["saw"] = function(exporters, midiNote, volume) { // TODO: Optimize this using
	const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
	const len = exporters.audioData.length;
	const pointer = exporters.audioData;
	volume *= 0.01;
	const dt = 1 / exporters.sampleRate;
	if (volume === 0 || len < 2) return;

	const freqInverse = 1 / freq;

	if (volume === 0.5) {
		for (let i = 0; i < len; i++) {
			pointer[i] += ((dt * i) % freqInverse) * freq - 0.5;
		}
	} else {
		volume *= 2;
		for (let i = 0; i < len; i++) {
			pointer[i] += volume * (((dt * i) % freqInverse) * freq - 0.5);
		}
	}
}

effects["tri"] = function(exporters, midiNote, volume) {
	const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
	const len = exporters.audioData.length;
	const pointer = exporters.audioData;
	volume *= 0.01;
	const dt = 1 / exporters.sampleRate;
	if (volume === 0 || len < 2) return;
	const f = dt*freq;

	if (volume === 1) {
		for (let i = 0; i < len; i++) {
			pointer[i] += abs((i*f)%1 - 0.5)*4 - 1;
		}
	} else {
		const doubleVolume = volume*4;
		for (let i = 0; i < len; i++) {
			pointer[i] += (abs((i*f)%1 - 0.5)*doubleVolume - volume);
		}
	}
}

effects["squ"] = function(exporters, midiNote, volume) {
	const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
	const len = exporters.audioData.length;
	const pointer = exporters.audioData;
	volume *= 0.01;
	const dt = 1 / exporters.sampleRate;
	if (volume === 0 || len < 2) return;
	const f = dt*freq;

	if (volume === 1) {
		for (let i = 0; i < len; i++) {
			pointer[i] += sign((i*f)%1 - 0.5);
		}
	} else {
		for (let i = 0; i < len; i++) {
			pointer[i] += sign((i*f)%1 - 0.5)*volume;
		}
	}
}

effects["blank"] = function(exporters, secs, dir) { // Direction
	const len = exporters.audioData.length;
	const pointer = exporters.audioData;
	if (secs <= 0) return;
	const samples = Math.ceil(exporters.sampleRate * secs);
	const blankAudio = new Float32Array(len + samples);
	if (dir === "f") blankAudio.set(pointer, samples); else blankAudio.set(pointer, 0);
	exporters.audioData = blankAudio;
}

effects["biquadfilter"] = async function(exporter, freq, res, type, dryGain2, wetGain2) {
	dryGain2 *= 0.01;
	wetGain2 *= 0.01;
	// Main render function, originally written by Claude Sonnet 4.5, but altered to support frequency filters
	async function renderWithFilter(sourceBuffer) {
		try {
			const duration = sourceBuffer.duration;
			const sampleRate = sourceBuffer.sampleRate;

			// Create offline context
			const offlineContext = new OfflineAudioContext(
				1,
				sampleRate * duration,
				sampleRate
			);

			// Create source
			const source = offlineContext.createBufferSource();
			source.buffer = sourceBuffer;

			// Create reverb
			const convolver = offlineContext.createBiquadFilter();
			convolver.type = type;
			convolver.Q.value = res;
			convolver.frequency.value = freq;

			// Create dry and wet gains
			const dryGain = offlineContext.createGain();
			const wetGain = offlineContext.createGain();
			dryGain.gain.value = dryGain2;
			wetGain.gain.value = wetGain2;

			// Connect the graph
			source.connect(dryGain);
			dryGain.connect(offlineContext.destination);

			source.connect(convolver);
			convolver.connect(wetGain);
			wetGain.connect(offlineContext.destination);

			// Start source
			source.start(0);
			// Render
			renderedBuffer = await offlineContext.startRendering();

			exporter.audioData = renderedBuffer.getChannelData(0);
		} catch (error) {
			alert(`There is an error with the frequency filter rendering process.\n\n${error.stack}`);
			console.error(error);
		}
	}

	const bb = audioContext.createBuffer(1, exporter.audioData.length, exporter.sampleRate);
	bb.copyToChannel(exporter.audioData, 0);

	await renderWithFilter(bb);
}

effects["biquadfilterlineartween"] = async function(exporter, freqStart, freqEnd, resStart, resEnd, type, dryGain2Start, dryGain2End, wetGain2Start, wetGain2End) {
	dryGain2Start *= 0.01;
	wetGain2Start *= 0.01;
	dryGain2End *= 0.01;
	wetGain2End *= 0.01;
	// Main render function, originally written by Claude Sonnet 4.5, but altered to support frequency filters
	async function renderWithFilter(sourceBuffer) {
		try {
			const duration = sourceBuffer.duration;
			const sampleRate = sourceBuffer.sampleRate;

			// Create offline context
			const offlineContext = new OfflineAudioContext(
				1,
				sampleRate * duration,
				sampleRate
			);

			// Create source
			const source = offlineContext.createBufferSource();
			source.buffer = sourceBuffer;

			// Create reverb
			const convolver = offlineContext.createBiquadFilter();
			convolver.type = type;
			convolver.Q.setValueAtTime(resStart, 0);
			convolver.frequency.setValueAtTime(freqStart, 0);
			convolver.Q.linearRampToValueAtTime(resEnd, duration);
			convolver.frequency.linearRampToValueAtTime(freqEnd, duration);

			// Create dry and wet gains
			const dryGain = offlineContext.createGain();
			const wetGain = offlineContext.createGain();
			dryGain.gain.setValueAtTime(dryGain2Start, 0);
			dryGain.gain.linearRampToValueAtTime(dryGain2End, duration);
			wetGain.gain.setValueAtTime(wetGain2Start, 0);
			wetGain.gain.linearRampToValueAtTime(wetGain2End, duration);

			// Connect the graph
			source.connect(dryGain);
			dryGain.connect(offlineContext.destination);

			source.connect(convolver);
			convolver.connect(wetGain);
			wetGain.connect(offlineContext.destination);

			// Start source
			source.start(0);
			// Render
			renderedBuffer = await offlineContext.startRendering();

			exporter.audioData = renderedBuffer.getChannelData(0);
		} catch (error) {
			alert(`There is an error with the frequency filter rendering process.\n\n${error.stack}`);
			console.error(error);
		}
	}

	const bb = audioContext.createBuffer(1, exporter.audioData.length, exporter.sampleRate);
	bb.copyToChannel(exporter.audioData, 0);

	await renderWithFilter(bb);
}

effects["midside"] = function(exporters, mode) { // Mode
	const len = exporters[0].audioData.length;
	const pointer1 = exporters[0].audioData;
	const pointer2 = exporters[1].audioData;
	if (mode === "rev") {
		let temp = 0;
		for (let i = 0; i < len; i++) {
			temp = pointer1[i];
			pointer1[i] = (pointer1[i] - pointer2[i]);
			pointer2[i] = (temp + pointer2[i]);
		}
	} else {
		let temp = 0;
		for (let i = 0; i < len; i++) {
			temp = pointer1[i];
			pointer1[i] = (pointer1[i] + pointer2[i]) * 0.5;
			pointer2[i] = (temp - pointer2[i]) * 0.5;
		}
	}
}

effects["trimsilence"] = function(exporters, mode, tolerance = 0.0060554543779289816) {
	const len = exporters.audioData.length;
	const pointer = exporters.audioData;
	if (!len) return;
	const ep = tolerance;
	let offset = 0;
	if (mode === "f") {
		const start = pointer[0];
		for (let i = 1; i < len; i++) {
			if (abs(pointer[i] - start) > ep) {offset = i;break;}
		}
		exporters.audioData = pointer.subarray(offset, len);
	} else if (mode === "e") {
		const end = pointer[len-1];
		for (let i = len-2; i >= 0; i--) {
			if (abs(pointer[i] - end) > ep) {offset = i;break;}
		}
		exporters.audioData = pointer.subarray(0, offset+1);
	} else if (mode === "all") {
		const views = [];
		let size = 0;
		let i = 1;
		let oldI = 0;
		let silent = pointer[0];
		const silentThreshold = 128; // ~2.666 ms for 48000 Hz audio
		let count = 0;
		while (i < len) {
			if (abs(silent - pointer[i]) <= ep) {
				count++;
				if (count >= silentThreshold) {
					const view = pointer.subarray(oldI,i+1);
					views.push(view);
					size+=view.length;
					i++;
					while (i < len && abs(silent - pointer[i]) <= ep) i++;
					count = 0;
					oldI = i;
					silent = pointer[i];
				}
			} else {silent = pointer[i];count = 0;}
			i++;
		}
		if (abs(oldI - len) > 1) {
			const view = pointer.subarray(oldI,len);
			views.push(view);
			size+=view.length;
		}
		const newArray = new Float32Array(size);
		size = 0;
		const numOfViews = views.length;
		for (let i = 0; i < numOfViews; i++) {
			newArray.set(views[i], size);
			size+=views[i].length;
		}
		exporters.audioData = newArray;
	} else {
		const start = pointer[0];
		const end = pointer[len-1];
		for (let i = 1; i < len; i++) {
			if (abs(pointer[i] - start) > ep) {offset = i;break;}
		}
		let offset2 = 0;
		for (let i = len-2; i >= 0; i--) {
			if (abs(pointer[i] - end) > ep) {offset2 = i;break;}
		}
		exporters.audioData = pointer.subarray(offset, offset2+1);
	}
}

effects["trimsilence2"] = function(exporters, mode, tolerance = 0.0060554543779289816) {
	const len = exporters[0].audioData.length;
	const pointer1 = exporters[0].audioData;
	const pointer2 = exporters[1].audioData;
	if (!len) return;
	const ep = tolerance;
	let offsetL = 0;
	if (mode === "f") {
		const start1 = pointer1[0];
		const start2 = pointer2[0];
		for (let i = 1; i < len; i++) {
			if (abs(pointer1[i] - start1) > ep && abs(pointer2[i] - start2) > ep) {offset = i;break;}
		}
		exporters[0].audioData = pointer1.subarray(offset, len);
		exporters[1].audioData = pointer2.subarray(offset, len);
	} else if (mode === "e") {
		const end1 = pointer1[len-1];
		const end2 = pointer2[len-1];
		for (let i = len-2; i >= 0; i--) {
			if (abs(pointer1[i] - end1) > ep && abs(pointer2[i] - end2) > ep) {offset = i;break;}
		}
		exporters[0].audioData = pointer1.subarray(0, offset+1);
		exporters[1].audioData = pointer2.subarray(0, offset+1);
	} else if (mode === "all") {
		const views = [];
		let size = 0;
		let i = 1;
		let oldI = 0;
		let silent1 = pointer1[0];
		let silent2 = pointer2[0];
		const silentThreshold = 128; // ~2.666 ms for 48000 Hz audio
		let count = 0;
		while (i < len) {
			if (abs(silent1 - pointer1[i]) <= ep && abs(silent2 - pointer2[i]) <= ep) {
				count++;
				if (count >= silentThreshold) {
					const view1 = pointer1.subarray(oldI,i+1);
					const view2 = pointer2.subarray(oldI,i+1);
					views.push([view1,view2]);
					size+=view1.length;
					i++;
					while (i < len && abs(silent1 - pointer1[i]) <= ep && abs(silent2 - pointer2[i]) <= ep) i++;
					count = 0;
					oldI = i;
					silent1 = pointer1[i];
					silent2 = pointer2[i];
				}
			} else {silent1 = pointer1[i];silent2 = pointer2[i];count = 0;}
			i++;
		}
		if (abs(oldI - len) > 1) {
			const view1 = pointer1.subarray(oldI,len);
			const view2 = pointer2.subarray(oldI,len);
			views.push([view1,view2]);
			size+=view1.length;
		}
		const newArray1 = new Float32Array(size);
		const oldSize = size;
		size = 0;
		const numOfViews = views.length;
		for (let i = 0; i < numOfViews; i++) {
			newArray1.set(views[i][0], size);
			size+=views[i][0].length;
		}
		exporters[0].audioData = newArray1;
		const newArray2 = new Float32Array(oldSize);
		size = 0;
		for (let i = 0; i < numOfViews; i++) {
			newArray2.set(views[i][1], size);
			size+=views[i][1].length;
		}
		exporters[1].audioData = newArray2;
	} else {
		const start1 = pointer1[0];
		const start2 = pointer2[0];
		const end1 = pointer1[len-1];
		const end2 = pointer2[len-1];
		for (let i = 1; i < len; i++) {
			if (abs(pointer1[i] - start1) > ep && abs(pointer2[i] - start2) > ep) {offset = i;break;}
		}
		let offset2 = 0;
		for (let i = len-2; i >= 0; i--) {
			if (abs(pointer1[i] - end1) > ep && abs(pointer2[i] - end2) > ep) {offset2 = i;break;}
		}
		exporters[0].audioData = pointer1.subarray(offset, offset2+1);
		exporters[1].audioData = pointer2.subarray(offset, offset2+1);
	}
}

effects["keepsilence"] = function(exporters, mode, tolerance = 0.0060554543779289816) {
	const len = exporters.audioData.length;
	const pointer = exporters.audioData;
	if (!len) return;
	const ep = tolerance;
	let offset = 0;
	if (mode === "f") {
		const start = pointer[0];
		for (let i = 1; i < len; i++) {
			if (abs(pointer[i] - start) <= ep) {offset = i;break;}
		}
		exporters.audioData = pointer.subarray(offset, len);
	} else if (mode === "e") {
		const end = pointer[len-1];
		for (let i = len-2; i >= 0; i--) {
			if (abs(pointer[i] - end) <= ep) {offset = i;break;}
		}
		exporters.audioData = pointer.subarray(0, offset+1);
	} else if (mode === "all") {
		const views = [];
		let size = 0;
		let i = 1;
		let oldI = 0;
		let silent = pointer[0];
		const silentThreshold = 128; // ~2.666 ms for 48000 Hz audio
		let count = 0;
		while (i < len) {
			if (abs(silent - pointer[i]) > ep) {
				count++;
				if (count >= silentThreshold) {
					const view = pointer.subarray(oldI,i+1);
					views.push(view);
					size+=view.length;
					i++;
					while (i < len && abs(silent - pointer[i]) > ep) i++;
					count = 0;
					oldI = i;
					silent = pointer[i];
				}
			} else {silent = pointer[i];count = 0;}
			i++;
		}
		if (abs(oldI - len) > 1) {
			const view = pointer.subarray(oldI,len);
			views.push(view);
			size+=view.length;
		}
		const newArray = new Float32Array(size);
		size = 0;
		const numOfViews = views.length;
		for (let i = 0; i < numOfViews; i++) {
			newArray.set(views[i], size);
			size+=views[i].length;
		}
		exporters.audioData = newArray;
	} else {
		const start = pointer[0];
		const end = pointer[len-1];
		for (let i = 1; i < len; i++) {
			if (abs(pointer[i] - start) <= ep) {offset = i;break;}
		}
		let offset2 = 0;
		for (let i = len-2; i >= 0; i--) {
			if (abs(pointer[i] - end) <= ep) {offset2 = i;break;}
		}
		exporters.audioData = pointer.subarray(offset, offset2+1);
	}
}

effects["keepsilence2"] = function(exporters, mode, tolerance = 0.0060554543779289816) {
	const len = exporters[0].audioData.length;
	const pointer1 = exporters[0].audioData;
	const pointer2 = exporters[1].audioData;
	if (!len) return;
	const ep = tolerance;
	let offsetL = 0;
	if (mode === "f") {
		const start1 = pointer1[0];
		const start2 = pointer2[0];
		for (let i = 1; i < len; i++) {
			if (abs(pointer1[i] - start1) <= ep && abs(pointer2[i] - start2) <= ep) {offset = i;break;}
		}
		exporters[0].audioData = pointer1.subarray(offset, len);
		exporters[1].audioData = pointer2.subarray(offset, len);
	} else if (mode === "e") {
		const end1 = pointer1[len-1];
		const end2 = pointer2[len-1];
		for (let i = len-2; i >= 0; i--) {
			if (abs(pointer1[i] - end1) <= ep && abs(pointer2[i] - end2) <= ep) {offset = i;break;}
		}
		exporters[0].audioData = pointer1.subarray(0, offset+1);
		exporters[1].audioData = pointer2.subarray(0, offset+1);
	} else if (mode === "all") {
		const views = [];
		let size = 0;
		let i = 1;
		let oldI = 0;
		let silent1 = pointer1[0];
		let silent2 = pointer2[0];
		const silentThreshold = 128; // ~2.666 ms for 48000 Hz audio
		let count = 0;
		while (i < len) {
			if (abs(silent1 - pointer1[i]) > ep && abs(silent2 - pointer2[i]) > ep) {
				count++;
				if (count >= silentThreshold) {
					const view1 = pointer1.subarray(oldI,i+1);
					const view2 = pointer2.subarray(oldI,i+1);
					views.push([view1,view2]);
					size+=view1.length;
					i++;
					while (i < len && abs(silent1 - pointer1[i]) > ep && abs(silent2 - pointer2[i]) > ep) i++;
					count = 0;
					oldI = i;
					silent1 = pointer1[i];
					silent2 = pointer2[i];
				}
			} else {silent1 = pointer1[i];silent2 = pointer2[i];count = 0;}
			i++;
		}
		if (abs(oldI - len) > 1) {
			const view1 = pointer1.subarray(oldI,len);
			const view2 = pointer2.subarray(oldI,len);
			views.push([view1,view2]);
			size+=view1.length;
		}
		const newArray1 = new Float32Array(size);
		const oldSize = size;
		size = 0;
		const numOfViews = views.length;
		for (let i = 0; i < numOfViews; i++) {
			newArray1.set(views[i][0], size);
			size+=views[i][0].length;
		}
		exporters[0].audioData = newArray1;
		const newArray2 = new Float32Array(oldSize);
		size = 0;
		for (let i = 0; i < numOfViews; i++) {
			newArray2.set(views[i][1], size);
			size+=views[i][1].length;
		}
		exporters[1].audioData = newArray2;
	} else {
		const start1 = pointer1[0];
		const start2 = pointer2[0];
		const end1 = pointer1[len-1];
		const end2 = pointer2[len-1];
		for (let i = 1; i < len; i++) {
			if (abs(pointer1[i] - start1) <= ep && abs(pointer2[i] - start2) <= ep) {offset = i;break;}
		}
		let offset2 = 0;
		for (let i = len-2; i >= 0; i--) {
			if (abs(pointer1[i] - end1) <= ep && abs(pointer2[i] - end2) <= ep) {offset2 = i;break;}
		}
		exporters[0].audioData = pointer1.subarray(offset, offset2+1);
		exporters[1].audioData = pointer2.subarray(offset, offset2+1);
	}
}
