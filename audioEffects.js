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
		'Multiplier: <input id="speed0" type="number" min="0.5" max="10" step="0.001" value="2"><br>Smoothen Up Audio: <input id="speed1" type="checkbox" checked>',
		2,
		"speed",
		[Number, identifier]
	],
	[
		"Resample Audio",
		"Resamples the audio to a specific sample rate.",
		'Samplerate: <select id="resample0"><option>11025</option><option>22050</option><option>44100</option><option>48000</option><option>96000</option></select><br>Smoothen Up Audio: <input id="resample1" type="checkbox" checked>',
		2,
		"resample",
		[Number, identifier]
	]
];
