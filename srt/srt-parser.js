/*
const lookup = new Uint8Array(256);lookup.fill(0);
for (let i = 0; i < 256; i++) {
    lookup[i] = i === 58 || i === 59 || i === 46 || i === 44;
}
*/

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
	const __sepLookup = new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);

	function __parseInt(data = new Uint8Array(0), offset = 0, len) {
		let x = __intLookup[data[offset++]];
		if (x & 0x10) return [offset, x];
		let current = 0;
		while (offset < len && !((current = __intLookup[data[offset++]]) & 0x10)) {
			x = x*10+current;
		}
		return [offset, x];
	}

	function __skipInt(data = new Uint8Array(0), offset = 0, len) {
		while (offset < len && __intLookup[data[offset++]] ^ 0x10) {}
		return offset;
	}

	function __skipBadData(data = new Uint8Array(0), offset = 0, len) {
		while (offset < len && (__intLookup[data[offset]] & 0x10) && __spaLookup[data[offset++]]) {}
		return offset;
	}

	function __skipWhitespace(data = new Uint8Array(0), offset = 0, len) {
		while (offset < len && __spaLookup[data[offset++]]) {}
		return offset;
	}

	const de = new TextDecoder().decode;

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
			pointer = __skipInt(data, pointer, len);
			if (__sepLookup[data[pointer]]) // data[pointer] !== 58 && data[pointer] !== 59 && data[pointer] !== 46 && data[pointer] !== 44
				pointer = oldPointer; // If there is no numerical sequence to skip, assume that it's part of a timeline

			// Skip more "bad" data
			pointer = __skipBadData(data, pointer, len);
			let fakeUnits = [];
			for (let j = 0; pointer < len; j++) {
				const parse = __parseInt(data, pointer, len);
				fakeUnits.push(parse[1]);
				pointer = parse[0]-1;
				if (!__sepLookup[data[pointer]]) break; else pointer++; // Normally, timestamps are separated by either a : , or . but we'll also allow ;
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
				pointer = parse[0]-1;
				if (!__sepLookup[data[pointer]]) break; else pointer++;
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
			let setPointer = 0;
			let newlineNum = 0;
			for (; pointer < len; pointer++) {
				if (data[pointer] === 13) pointer++; // \r
				if (data[pointer] === 10) { // \n
					newlineNum++;
					if (newlineNum >= 2) break; else continue;
				}
				setPointer = pointer+1;
				newlineNum = 0;
			}
			subtitles.push(new SRTSubtitle(de(data.subarray(oldPointer-1, setPointer)), timeStart, timeEnd));
		}

		const lastSubtitle = subtitles[subtitles.length - 1];
		if (lastSubtitle.text === "" && isNaN(lastSubtitle.start) && isNaN(lastSubtitle.end)) {
			subtitles.pop();
		}

		return subtitles.sort((x,y)=>x.start - y.start);
	}

	function __timestamp(time) {
		const t = new Array(7);
		const hours = Math.floor(time/3600);
		t[0] = hours.toFixed(0).padStart(2, "0");
		time -= hours*3600;
		t[1] = ":";
		const minutes = Math.floor(time/60);
		t[2] = minutes.toFixed(0).padStart(2, "0");
		time -= minutes*60;
		t[3] = ":";
		const seconds = Math.floor(time);
		t[4] = seconds.toFixed(0).padStart(2, "0");
		time -= seconds;
		t[5] = ",";
		const milliseconds = Math.floor(time * 1000);
		t[6] = milliseconds.toFixed(0).padStart(3, "0");
		return t.join("");
	}

	function __timeline(start, end) {
		return [__timestamp(start), "-->", __timestamp(end)].join(" ");
	}

	function ExportFromSubtitles(subtitles = [], __isAlreadySorted = true) {
		if (!__isAlreadySorted) subtitles = subtitles.sort((x,y)=>x.start - y.start);
		const len = subtitles.length;
		const binaryData = [];
		for (let i = 0; i < len; i++) {
			const subtitle = subtitles[i];
			const data = [i.toFixed(0), __timeline(subtitle.start, subtitle.end), subtitle.text].join("\n");
			binaryData.push(data);
		}
		return binaryData.join("\n\n");
	}

	return {
		SRTSubtitle,
		ParseSRTFile,
		ExportFromSubtitles
	}
})();
