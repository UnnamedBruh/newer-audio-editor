function __analyze(channel1, channel2, rate, analysis) {
	const len = channel1.length;
	const data = [];
	if (!channel2 || !channel2.length) {
		let acc = 0;
		if (analysis === 3) {
			let max;
			for (let j = 1; j < len; j = max) {
				max = j + (j === 1 ? 511 : 512);
				if (max > len) max = len;
				let frame1 = new Float32Array(512);
				let frame2 = new Uint8Array(512);
				let ind;
				let whichBias = 0;
				for (let i = 0; i < max; i++) {
					acc = channel1[i+j] - channel1[i+j - 1];
					frame1[i] = acc;
					frame2[i] = (acc * 128) + 128;
					const compOfFrame2 = (Math.floor(acc * 244) / 122) - 1;
					if (Math.abs(compOfFrame2 - acc) > 0.008) whichBias++; else whichBias--;
				}
				if (whichBias > 0) data.push(frame1); else data.push(frame2);
			}
		}
	} else {
		
	}
	return data;
}

function encodeFormat(channel1 = new Float32Array(), channel2 = new Float32Array(), sampleRate = 48000, analysis = 3) {
	const analysisData = __analyze(channel1, channel2, sampleRate, bitRate);
	
}
