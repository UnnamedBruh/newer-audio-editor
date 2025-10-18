function identifier(x) {
	return x;
}

const effectsList = [
	[
		"Gain",
		"Amplifies each sample's value in the audio, making the sound louder or quieter.",
		'Multiplier: <input id="gain0" type="number" min="-10" max="10" step="0.001" value="2">',
		1,
		"gain",
		[Number]
	],
	[
		"Playback Speed",
		"Speeds up or slows down the audio.",
		'Multiplier: <input id="speed0" type="number" min="0.5" max="10" step="0.001" value="2"><br>Smooth Audio: <input id="speed1" type="checkbox" checked>',
		2,
		"speed",
		[Number, identifier]
	],
	[
		"Resample Audio",
		"Resamples the audio to a specific sample rate.",
		'Samplerate: <select id="resample0"><option>6000</option><option>8000</option><option>11025</option><option>16000</option><option>22050</option><option>33075</option><option>44100</option><option>48000</option><option>72000</option><option>88200</option><option>96000</option><option>176400</option><option>192000</option></select><br>Smooth Audio: <input id="resample1" type="checkbox" checked>',
		2,
		"resample",
		[Number, identifier]
	],
	[
		"Quantization",
		"Adds a staticky effect (by rounding each sample value to the nearest value determined by the number of bits). Lower bit value = vaguer audio, higher bit value = clearer audio",
		'Bits: <input id="quantize0" type="number" min="1" max="31" step="1" value="8"><br>Internal Rounding Function: <select id="quantize1" oninput="document.getElementById(\'custom\').textContent = this.value === \'fl\' ? \'Samples will be adapted to simulate 16-bit floating point precision when applied; the Bits field does not affect the result.\' : this.value === \'mu\' ? \'A G.711 μ-law encoder (popular in telecom contexts) will adapt samples to simulate μ-law precision when applied; the Bits field does not affect the result.\' : \'\';"><option value="r">round</option><option value="t">trunc</option><option value="f">floor</option><option value="c">ceil</option><option value="fl">float16</option><option value="mu">G.711 μ-law</option></select><br><a id="custom"></a>',
		2,
		"quantize",
		[Number, identifier]
	],
	[
		"Smooth Audio",
		"Picks the soonest sample for every nth group, or interpolates samples into each other linearly or with an accumulator, creating a \"lowpass\" effect.",
		'<a id="custom">Smoothing Threshold (measured in samples)</a>: <input id="smooth0" type="number" min="1" max="256" step="1" value="4"><br>Blending Method: <select id="smooth1" oninput="document.getElementById(\'custom\').textContent = this.value === \'a\' || this.value === \'r\' ? \'Interpolation Level (as percentage)\' : (this.value === \'dyn\' ? \'Level Of Softness (measured in hundredths)\' : \'Smoothing Threshold (measured in samples)\');"><option value="n">no-interpolating</option><option value="l">linear interpolation</option><option value="a">accumulator-based interpolation</option><option value="r">right-sample interpolation</option><option value="dyn">dynamic interpolation</option></select>',
		2,
		"smooth",
		[Number, identifier]
	],
	[
		"Distort",
		"Distorts the audio using a mathematical formula. Simple, but still achieves wacky results.",
		'Apply percentage: <input id="distort0" type="number" min="0" max="100" step="1" value="100" placeholder="Hover for info" style="width: 100px" title="How much this effect is applied. For example, 50% means the audio is half-distorted, 100% means the audio is fully distorted, and 0% means this effect won\'t apply.">%<br>Blending Method: <select id="distort1"><option value="s">sqrt(n)</option><option value="c">cbrt(n)</option><option value="sq">n * n</option><option value="h">n / (floor(n * 8) / 8)</option><option value="xpo">n^n (n to the power of n)</option></select>',
		2,
		"distort",
		[Number, identifier]
	],
	[
		"Echo",
		"Repeats the audio N times, each repetition delaying itself after a specified time relative to the previous one.",
		'Echo Volume: <input id="echo0" type="number" min="0" max="100" step="1" value="50" placeholder="Hover for info" style="width: 100px" title="How loud the echoing audio is.">%<br># Of Echoes: <input id="echo1" type="number" min="1" step="1" value="2" placeholder="Hover for info" style="width: 100px" title="How many of the same audio will be heard after a certain period."><br>Echo Delay: <input id="echo2" type="number" min="0" step="0.01" value="0.5" placeholder="Hover for info" style="width: 100px" title="How long the delay is before the audio repeats itself during playback."><br>Echo Volume Multiplier: <input id="echo3" type="number" min="0" step="0.01" value="50" placeholder="Hover for info" style="width: 100px" title="How loud or quiet each repetition is, relative to the previous one.">%',
		4,
		"echo",
		[Number, Number, Number, Number]
	],
	[
		"Infinite Echo",
		"Plays back the audio infinitely. You can see its similarities by selecting the \"Echo\" effect.",
		'Echo Volume & Volume Multiplier: <input id="echo_arbr0" type="number" min="0" max="100" step="1" value="50" placeholder="Hover for info" style="width: 100px" title="How loud the echoing audio is.">%<br>Echo Delay: <input id="echo_arbr1" type="number" min="0" step="0.01" value="0.5" placeholder="Hover for info" style="width: 100px" title="How long the delay is before the audio repeats itself during playback.">',
		2,
		"echo_arbr",
		[Number, Number]
	],
	[
		"Noise (Static)",
		"Adds static to the audio.",
		'Noise Type: <select id="noise0"><option value="wn">white noise</option><option value="bn">brown noise</option><option value="pn">pink noise</option></select><br>Volume: <input id="noise1" type="number" min="0" max="100" step="1" value="50" placeholder="Hover for info" style="width: 100px" title="How loud the static is.">%<br>Is "Algorithmistic": <input id="noise2" type="checkbox" checked title="Determines whether their noise\'s implementations adhere to faithful algorithms, or default to generic or approximate programs.">',
		3,
		"noise",
		[identifier, Number, identifier]
	],
	[
		"Reverse",
		"Fully reverses the audio.",
		'',
		0,
		"reverse",
		[]
	],
	[
		"Repeat",
		"Repeats the audio a certain number of times. The number of times can be a decimal value.",
		'Repeats: <input id="repeat0" type="number" min="0" step="0.1" value="2" style="width: 100px">',
		1,
		"repeat",
		[Number]
	],
	[
		"Chorus",
		"Alters the audio like one of those classic rocket whoosh sounds. To better grasp it, it layers the original audio on a copy of itself whose speed \"swings\" overtime. The distance cannot be negated.",
		'Volume: <input id="chorus0" type="number" min="0" step="1" value="50" style="width: 100px">%<br># Of Cycles (per secs): <input id="chorus1" type="number" min="0" step="0.1" value="1" style="width: 100px"><br>Delay & Distance (in secs): <input id="chorus2" type="number" min="0" step="1" value="0.005" style="width: 100px"><br>Anti-Aliasing: <input id="chorus3" type="checkbox" checked title="The chorus is smoother, but it takes a bit longer to apply.">',
		4,
		"chorus",
		[Number, Number, Number, identifier]
	],
	[
		"Previous-Door Subtraction",
		"Alters the audio's frequencies by subtracting the current samples by the previous ones. (Apply percentage = -100% gives you in-place processing, and 100% gives you full difference in new buffer. Step controls the harshness of the effect.)",
		'Apply percentage: <input id="difference0" type="number" min="0" step="1" value="100" style="width: 100px">%<br>Step: <input id="difference1" type="number" min="0" max="1" step="0.01" value="1" style="width: 100px">',
		2,
		"difference",
		[Number, Number]
	]
].sort((x, y) => {
	const b = x[0].split("").map(x => x.charCodeAt());
	const bb = y[0].split("").map(x => x.charCodeAt());
	for (let i = 0; i < b.length && i < bb.length; i++) {
		if (b[i] > bb[i]) return true; else if (b[i] < bb[i]) return false;
	}
	return b.length > bb.length;
});
