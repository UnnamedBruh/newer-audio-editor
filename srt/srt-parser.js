const SRT = (function() {
	class SRTSubtitle {
		constructor(subtitleText = "", start = 0, end = 0) {
			this.text = subtitleText;
			if (start > end) {
				const t = start;
				start = end;
				end = t;
			}
			this.start = start;
			this.end = end;
		}
	}

	const __intLookup = new Uint8Array([16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,0,1,2,3,4,5,6,7,8,9,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16]);
	const __spaLookup = new Uint8Array([0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);

	function __parseInt(data = new Uint8Array(0), offset = 0, len) {
		let x = __intLookup[data[offset++]];
		if (x & 0x10) return [offset, x];
		let current = 0;
		let multiply = 10;
		while (offset < len && !((current = __intLookup[data[offset++]]) & 0x10)) {
			x = x*10+current;
		}
		return [offset, x];
	}

	function __skipBadData(data = new Uint8Array(0), offset = 0, len) {
		while (offset < len && (__intLookup[data[offset]] & 0x10) && __spaLookup[data[offset++]]) {}
		return offset;
	}

	function __skipWhitespace(data = new Uint8Array(0), offset = 0, len) {
		while (offset < len && __spaLookup[data[offset++]]) {}
		return offset;
	}

	function ParseSRTFile(data = new Uint8Array(0), settings = {
		noBlankSubtitles: true
	}) {
		const subtitles = [];
		const len = data.length;
		let pointer = 0;

		const {noBlankSubtitles} = settings;
		let skipBadStep = true;
		while (pointer < len) {
			// If there is garbage data, many parsing systems would throw an error. But that's not very convenient, so we'll just ignore the garbage data.
			if (skipBadStep) {pointer = __skipBadData(data, pointer, len);skipBadStep = true;}

			// Skip the sequence number
			let oldPointer = pointer;
			pointer = __parseInt(data, pointer, len)[0];
			if (data[pointer] === 58 || data[pointer] === 59 || data[pointer] === 46 || data[pointer] === 44) pointer = oldPointer; // If there is no numerical sequence to skip, assume that it's part of a timeline

			// Skip more "bad" data
			pointer = __skipBadData(data, pointer, len);
			let fakeUnits = [];
			for (let j = 0; pointer < len; j++) {
				const parse = __parseInt(data, pointer, len);
				fakeUnits.push(parse[1]);
				pointer = __skipBadData(data, parse[0] - 1, len);
				if (data[pointer] !== 58 && data[pointer] !== 59 && data[pointer] !== 46 && data[pointer] !== 44) break; else pointer++; // Normally, timestamps are separated by either a : , or . but we'll also allow ;
			}

			const timeStart = fakeUnits[Math.max(0, fakeUnits.length-4)] * 3600 + fakeUnits[Math.max(0, fakeUnits.length-3)] * 60 + fakeUnits[Math.max(0, fakeUnits.length-2)] + fakeUnits[Math.max(0, fakeUnits.length-1)] * 0.001;
			pointer = __skipBadData(data, pointer, len);

			while (pointer < len) {
				if (data[pointer] === 45) { // -
				pointer++;
				if (data[pointer] === 45) { // --
				pointer++;
				if (data[pointer] === 62) { // -->
				pointer++;
				}
				}
				}

				pointer = __skipBadData(data, pointer, len);
				if (!(__intLookup[data[pointer]] & 0x10)) break;
			}
			fakeUnits = [];

			for (let j = 0; pointer < len; j++) {
				const parse = __parseInt(data, pointer, len);
				fakeUnits.push(parse[1]);
				pointer = __skipBadData(data, parse[0] - 1, len);
				if (data[pointer] !== 58 && data[pointer] !== 59 && data[pointer] !== 46 && data[pointer] !== 44) break; else pointer++;
			}

			const timeEnd = fakeUnits[Math.max(0, fakeUnits.length-4)] * 3600 + fakeUnits[Math.max(0, fakeUnits.length-3)] * 60 + fakeUnits[Math.max(0, fakeUnits.length-2)] + fakeUnits[Math.max(0, fakeUnits.length-1)] * 0.001;

			oldPointer = pointer;
			pointer = __skipWhitespace(data, pointer, len);
			if ((pointer - oldPointer >= 2) && !(__intLookup[data[pointer]] & 0x10)) {
				if (!noBlankSubtitles) {
					subtitles.push(new SRTSubtitle("", timeStart, timeEnd));
					skipBadStep = false; // Since we already encountered a number, we don't have to skip the "bad data".
					continue;
				}
			}

			oldPointer = pointer;
			let newlineNum = 0;
			for (; pointer < len; pointer++) {
				if (data[pointer] === 13) pointer++; // \r
				if (data[pointer] === 10) { // \n
					newlineNum++;
					if (newlineNum >= 2) break; else continue;
				}
				newlineNum = 0;
			}
			subtitles.push(new SRTSubtitle(new TextDecoder().decode(data.subarray(oldPointer-1, pointer)).trimEnd(), timeStart, timeEnd));
		}

		const lastSubtitle = subtitles[subtitles.length - 1];
		if (lastSubtitle.text === "" && isNaN(lastSubtitle.start) && isNaN(lastSubtitle.end)) {
			subtitles.pop();
		}

		return subtitles.sort((x,y)=>x.start - y.start);
	}

	return {
		SRTSubtitle,
		ParseSRTFile
	}
})();
