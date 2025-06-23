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
		"Distorts the audio using a mathematical function/formula. Simple, but still achieves wacky results.",
		'Apply percentage: <input id="distort0" type="number" min="0" max="100" step="1" value="100" placeholder="Hover for info" title="How much this effect is applied. For example, 50% means the audio is half-distorted, 100% means the audio is fully distorted, and 0% means this effect won\'t apply.">%<br>Blending Method: <select id="distort1""><option value="s">sqrt</option><option value="c">cbrt</option><option value="co">cos</option><option value="sq">n * n</option><option value="h">n / (floor(n * 8) / 8)</option></select><br>This effect doesn\'t function at all yet... lol.',
		2,
		"distort",
		[Number, identifier]
	]
];
