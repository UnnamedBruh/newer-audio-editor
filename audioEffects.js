function identifier(x) {
	return x;
}

function percent(x) {
	return x * 0.01;
}

const frequencyReference = '<br><br>Frequency Reference*<br>Human Voice (Mature Male): 80 Hertz - 180 Hertz<br>Human Voice (Mature Female): 120 Hertz - 310 Hertz<br><br><a style="font-size: 8px">*Sourced from</a> <a style="font-size: 8px" href="https://pmc.ncbi.nlm.nih.gov/articles/PMC8478519/">https://pmc.ncbi.nlm.nih.gov/articles/PMC8478519/</a>';

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
		"Speed",
		"Speeds up or slows down the audio.",
		'Multiplier: <input id="speed0" type="number" min="0.5" max="10" step="0.001" value="2"><br>Smooth Audio: <input id="speed1" type="checkbox" checked>',
		2,
		"speed",
		[Number, identifier]
	],
	[
		"Resample",
		"Resamples the audio to a specific sample rate.",
		'Samplerate: <select id="resample0"><option>6000</option><option>8000</option><option>11025</option><option>16000</option><option>22050</option><option>33075</option><option>44100</option><option>48000</option><option>72000</option><option>88200</option><option>96000</option><option>176400</option><option>192000</option></select><br>Smooth Audio: <input id="resample1" type="checkbox" checked>',
		2,
		"resample",
		[Number, identifier]
	],
	[
		"Quantize",
		"Adds a staticky effect (by rounding each sample value to the nearest value determined by the number of bits). Lower bit value = vaguer audio, higher bit value = clearer audio",
		'Bits: <input id="quantize0" type="number" min="1" max="31" step="1" value="8"><br>Internal Rounding Function: <select id="quantize1" oninput="document.getElementById(\'custom\').textContent = this.value === \'fl\' ? \'Samples will be adapted to simulate 16-bit floating point precision when applied; the Bits field does not affect the result.\' : this.value === \'mu\' ? \'A G.711 μ-law encoder (popular in telecom contexts) will adapt samples to simulate μ-law precision when applied; the Bits field does not affect the result.\' : \'\';"><option value="r">round</option><option value="t">trunc</option><option value="f">floor</option><option value="c">ceil</option><option value="fl">float16</option><option value="mu">G.711 μ-law</option></select><br><a id="custom"></a>',
		2,
		"quantize",
		[Number, identifier]
	],
	[
		"Lowpass (Smooth)",
		"Picks the soonest sample for every nth group, or interpolates samples into each other linearly or with an accumulator, creating a \"lowpass\" effect.",
		'<a id="custom">Smoothing Threshold (measured in samples)</a>: <input id="smooth0" type="number" min="1" max="256" step="1" value="4"><br>Blending Method: <select id="smooth1" oninput="document.getElementById(\'custom\').textContent = this.value === \'a\' || this.value === \'r\' ? \'Interpolation Level (as percentage)\' : (this.value === \'dyn\' ? \'Level Of Softness (measured in hundredths)\' : \'Smoothing Threshold (measured in samples)\');"><option value="n">no-interpolating</option><option value="l">linear interpolation</option><option value="a">accumulator-based interpolation</option><option value="r">right-sample interpolation</option><option value="dyn">dynamic interpolation</option></select>',
		2,
		"smooth",
		[Number, identifier]
	],
	[
		"Distort",
		"Distorts the audio using a mathematical formula. Simple, but still achieves wacky results.",
		'Apply percentage: <input id="distort0" type="number" min="0" max="100" step="1" value="100" placeholder="Hover for info" style="width: 100px" title="How much this effect is applied. For example, 50% means the audio is half-distorted, 100% means the audio is fully distorted, and 0% means this effect won\'t apply.">%<br>Blending Method: <select id="distort1"><option value="s">sqrt(n)</option><option value="c">cbrt(n)</option><option value="sq">n * n</option><option value="h">n / (floor(n * 8) / 8)</option><option value="xpo">n^n (n to the power of n)</option><option value="hi">high-frequency (FULL VOLUME WARNING)</option><option value="sin">sin(n)</option></select>',
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
		"Echo (Infinite)",
		"Plays back the audio infinitely. You can see its similarities by selecting the \"Echo\" effect.",
		'Echo Volume & Volume Multiplier: <input id="echo_arbr0" type="number" min="0" max="100" step="1" value="50" placeholder="Hover for info" style="width: 100px" title="How loud the echoing audio is.">%<br>Echo Delay: <input id="echo_arbr1" type="number" min="0" step="0.01" value="0.5" placeholder="Hover for info" style="width: 100px" title="How long the delay is before the audio repeats itself during playback.">',
		2,
		"echo_arbr",
		[Number, Number]
	],
	[
		"Note: Noise (Static)",
		"Adds static to the audio.",
		'Noise Type: <select id="noise0"><option value="wn">white noise</option><option value="gr">gray noise</option><option value="orn">orange noise</option><option value="green">green noise</option><option value="bln">blue noise</option><option value="vn">violet noise</option><option value="pn">pink noise (Voss-McCartney)</option><option value="pnacc">pink noise (accumulator-based)</option><option value="bn">brown noise</option></select><br>Volume: <input id="noise1" type="number" min="0" max="100" step="1" value="50" placeholder="Hover for info" style="width: 100px" title="How loud the static is.">%<br>Is "Algorithmistic": <input id="noise2" type="checkbox" checked title="Determines whether their noise\'s implementations adhere to faithful algorithms, or default to generic or approximate programs.">',
		3,
		"noise",
		[identifier, Number, identifier]
	],
	[
		"Note: Experimental Noise (Static)",
		"Allows synthesizers to experiment with retro, popular static algorithms that people wanted to use, but either couldn't access them, or used audio DAWs and plugins that either A) lacked the provided options below or B) locked access behind a paywall.",
		'Noise Type: <select id="experimentalnoise0" oninput="if(this.value===\'triper\'){[\'text0\',\'text1\',\'text2\'].forEach((x,i)=>document.getElementById(x).textContent=`Frequency ${i+1} (in Midi notes, 0 to 255)`);}else{document.getElementById(\'text0\').textContent=\'When To Change Base (in samples)\';document.getElementById(\'text1\').textContent=\'Loudness of White Noise\';document.getElementById(\'text2\').textContent=\'(not used)\';}"><option value="sah">sample-and-hold</option><option value="triper">Perlin noise (three Hz values)</option></select><br>Volume: <input id="experimentalnoise1" type="number" min="0" max="100" step="1" value="50" placeholder="Hover for info" style="width: 100px" title="How loud the experimental static is.">%<br><a id="text0">When To Change Base (in samples)</a>: <input id="experimentalnoise2" type="number" min="1" max="24000" step="1" value="12"><br><a id="text1">Loudness Of White Noise</a>: <input id="experimentalnoise3" type="number" min="0" max="24000" value="0.03"><br><a id="text2">(not used)</a>: <input id="experimentalnoise4" type="number" min="0" max="24000" value="1">',
		5,
		"experimentalnoise",
		[identifier, Number, Number, Number, Number]
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
		"Highpass (Previous-Door Subtraction)",
		"Alters the audio's frequencies by subtracting the current samples by the previous ones. (Apply percentage = -100% gives you in-place processing, and 100% gives you full difference in new buffer. Step controls the harshness of the effect.)",
		'Apply percentage: <input id="difference0" type="number" min="0" step="1" value="100" style="width: 100px">%<br>Step: <input id="difference1" type="number" min="0" max="1" step="0.01" value="1" style="width: 100px">',
		2,
		"difference",
		[Number, Number]
	],
	[
		"Normalize Audio",
		"Normalizes the audio so it does not clip or glitch when it is exported. The underlying algorithm finds the highest peak.",
		'',
		0,
		"normalize",
		[]
	],
	[
		"Normalize Audio (Dynamic/TV)",
		"Dynamically normalizes the audio so it does not clip or glitch when it is exported. The underlying algorithm dynamically adjusts the volume of the audio, making sure the loudest sections are safely clipped.",
		'',
		0,
		"tvnormalize",
		[]
	],
	[
		"Fade",
		"Fades the audio in a specified direction.",
		'Direction: <select id="fade0"><option>in</option><option>out</option></select><br>Tween: <select id="fade1"><option value="l">linear</option><option value="ein">ease in</option><option value="eout">ease out</option><option value="cub">cubic</option></select>',
		2,
		"fade",
		[identifier, identifier]
	],
	[
		"Reverb (Convol)",
		"Reverberates the audio using a programmatically-generated IR (Impulse Response). It is widely used for generating natural reverberations, at the cost of performance.",
		'Reverb Time (in seconds): <input id="reverb0" type="number" min="0" step="0.083333333333333" value="2" style="width: 100px"><br>Reverb Decay: <input id="reverb1" type="number" min="0" step="0.083333333333333" value="2" style="width: 100px"><br>Dry Mix: <input id="reverb2" type="number" min="0" step="1" value="50" style="width: 100px">%<br>Wet Mix: <input id="reverb3" type="number" min="0" step="1" value="50" style="width: 100px">%<br>Reverb Instructions Overtime: <select id="reverb4"><option value="d">Change nothing</option><option value="real">Linearly damp frequency range</option><option value="realfast">Quickly damp frequency range</option><option value="realspike">Damp frequency range add spikes at start</option></select><br>Max Frequency Range: <input id="reverb5" type="number" min="0" step="1" value="80" style="width: 100px"><br>Chance Of Impulse Spikes (in samples): <input id="reverb6" type="number" min="1" step="0.33333333333333333333" value="3" style="width: 100px">%',
		7,
		"reverb",
		[Number, Number, Number, Number, identifier, percent, Number]
	],
	[
		"Note: Sine Wave",
		"Generates a sine wave at a certain frequency and volume.",
		'Pitch (in MIDI notes): <input id="sine0" type="number" min="0" step="1" value="60" max="127" style="width: 100px"><br>Volume: <input id="sine1" type="number" min="0" step="1" value="100" style="width: 100px">%',
		2,
		"sine",
		[Number, Number]
	],
	[
		"Note: Sawtooth Wave",
		"Generates a sawtooth wave at a certain frequency and volume.",
		'Pitch (in MIDI notes): <input id="saw0" type="number" min="0" step="1" value="60" max="127" style="width: 100px"><br>Volume: <input id="saw1" type="number" min="0" step="1" value="100" style="width: 100px">%',
		2,
		"saw",
		[Number, Number]
	],
	[
		"Note: Triangle Wave",
		"Generates a triangle wave at a certain frequency and volume.",
		'Pitch (in MIDI notes): <input id="tri0" type="number" min="0" step="1" value="60" max="127" style="width: 100px"><br>Volume: <input id="tri1" type="number" min="0" step="1" value="100" style="width: 100px">%',
		2,
		"tri",
		[Number, Number]
	],
	[
		"Note: Square Wave",
		"Generates a square wave at a certain frequency and volume.",
		'Pitch (in MIDI notes): <input id="squ0" type="number" min="0" step="1" value="60" max="127" style="width: 100px"><br>Volume: <input id="squ1" type="number" min="0" step="1" value="100" style="width: 100px">%',
		2,
		"squ",
		[Number, Number]
	],
	[
		"Blank",
		"Prepends (inserts at the beginning) or appends (inserts at the end) silence to the audio track.",
		'Seconds of Silence: <input id="blank0" type="number" min="0" step="0.1" value="1" style="width: 100px"><br>Direction: <select id="blank1"><option value="f">start of audio</option><option>end of audio</option></select>',
		2,
		"blank",
		[Number, identifier]
	],
	[
		"Biquad Frequency Filter",
		"Strips away or amplifies a certain range of frequencies of the audio.",
		'Frequency (in Hertz): <input id="biquadfilter0" type="number" min="0" step="1" value="480" max="24000" style="width: 100px"><br>Resonance (Quality): <input id="biquadfilter1" type="number" min="0" step="0.01" value="1" style="width: 100px"><br>Filter instructions? <select id="biquadfilter2"><option value="lowpass">Strip away high frequencies</option><option value="highpass">Strip away low frequencies</option></select><br>Dry Mix: <input id="biquadfilter3" type="number" min="0" step="1" value="0" style="width: 100px">%<br>Wet Mix: <input id="biquadfilter4" type="number" min="0" step="1" value="100" style="width: 100px">%' + frequencyReference,
		5,
		"biquadfilter",
		[Number, Number, identifier, Number, Number]
	],
	[
		"Biquad Frequency Filter (Linear Tween)",
		"Strips away or amplifies a certain range of frequencies of the audio overtime. This is often used in modern or experimental music editing.",
		'Frequency (in Hertz): <input id="biquadfilterlineartween0" type="number" min="0" step="1" value="480" max="24000" style="width: 100px"><br>Frequency (in Hertz) End: <input id="biquadfilterlineartween1" type="number" min="0" step="1" value="480" max="24000" style="width: 100px"><br>Resonance (Quality): <input id="biquadfilterlineartween2" type="number" min="0" step="0.01" value="1" style="width: 100px"><br>Resonance (Quality) End: <input id="biquadfilterlineartween3" type="number" min="0" step="0.01" value="1" style="width: 100px"><br>Filter instructions? <select id="biquadfilterlineartween4"><option value="lowpass">Strip away high frequencies</option><option value="highpass">Strip away low frequencies</option></select><br>Dry Mix: <input id="biquadfilterlineartween5" type="number" min="0" step="1" value="0" style="width: 100px">%<br>Dry Mix End: <input id="biquadfilterlineartween6" type="number" min="0" step="1" value="0" style="width: 100px">%<br>Wet Mix: <input id="biquadfilterlineartween7" type="number" min="0" step="1" value="100" style="width: 100px">%<br>Wet Mix End: <input id="biquadfilterlineartween8" type="number" min="0" step="1" value="100" style="width: 100px">%' + frequencyReference,
		9,
		"biquadfilterlineartween",
		[Number, Number, Number, Number, identifier, Number, Number, Number, Number]
	],
	[
		"Mid/Side Representation",
		"This audio effect performs the stereo -> Mid/Side conversion formula, which often allows better psychoacoustic compression in many audio codecs by separating centered sound and the panned sound into different categories.",
		'Mode: <select id="midside0"><option>Perform</option><option value="rev">Reverse</option></select> Conversion',
		1,
		"midside",
		[identifier],
		2
	],
	[
		"Trim Silence",
		"Trims out the selected locations (specified by the dropdown) of the silent sections of audio.",
		'Locations: <select id="trimsilence0"><option value="f">start of audio</option><option value="e">end of audio</option><option>both sides</option><option value="all">all silent audio</option></select><br>Tolerance Level: <input id="trimsilence1" type="number" min="0" step="0.0060554543779289816" value="0.0060554543779289816" max="0.1" style="width: 100px">',
		2,
		"trimsilence",
		[identifier, Number]
	],
	[
		"Trim Silence (Stereo)",
		"Trims out the selected locations (specified by the dropdown) of the silent sections of audio, while also keeping sync of both channels.",
		'Locations: <select id="trimsilence20"><option value="f">start of audio</option><option value="e">end of audio</option><option>both sides</option><option value="all">all silent audio</option></select><br>Tolerance Level: <input id="trimsilence21" type="number" min="0" step="0.0060554543779289816" value="0.0060554543779289816" max="0.1" style="width: 100px">',
		2,
		"trimsilence2",
		[identifier, Number],
		2
	],
	[
		"Filter Silence",
		"Filters in only the selected locations (specified by the dropdown) of the silent sections of audio, and keeps audible sections out.",
		'Locations: <select id="keepsilence0"><option value="f">start of audio</option><option value="e">end of audio</option><option>both sides</option><option value="all">all silent audio</option></select><br>Tolerance Level: <input id="keepsilence1" type="number" min="0" step="0.0060554543779289816" value="0.0060554543779289816" max="0.1" style="width: 100px">',
		2,
		"keepsilence",
		[identifier, Number]
	],
	[
		"Filter Silence (Stereo)",
		"Filters in only the selected locations (specified by the dropdown) of the silent sections of audio, and keeps audible sections out, while also keeping sync of both channels.",
		'Locations: <select id="keepsilence20"><option value="f">start of audio</option><option value="e">end of audio</option><option>both sides</option><option value="all">all silent audio</option></select><br>Tolerance Level: <input id="keepsilence21" type="number" min="0" step="0.0060554543779289816" value="0.0060554543779289816" max="0.1" style="width: 100px">',
		2,
		"keepsilence2",
		[identifier, Number],
		2
	]
].sort((a, b) => a[0].localeCompare(b[0]));
