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
		'Multiplier: <input id="speed0" type="number" min="0.5" max="10" step="0.001" value="2">',
		1,
		"speed",
		[Number]
	]
];
