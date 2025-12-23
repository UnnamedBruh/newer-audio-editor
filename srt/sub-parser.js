/*
const lookup = new Uint8Array(256);lookup.fill(0);
for (let i = 0; i < 256; i++) {
    lookup[i] = i === 58 || i === 59 || i === 46 || i === 44;
}
*/

const SUB = (function() {
	class SUBSubtitle {
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
	const __sepLookup = new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);

	function __parseDouble(data = new Uint8Array(0), offset = 0, len) {
		let x = __intLookup[data[offset++]];
		if (x & 0x10) return [offset, x];
		let current = 0;
		while (offset < len && !((current = __intLookup[data[offset++]]) & 0x10)) {
			x = x*10+current;
		}
		if (data[offset] === 46) { // 46
			offset++;
			let mult = 0.1;
			while (offset < len && !((current = __intLookup[data[offset++]]) & 0x10)) {
				x = x*mult+current;
				mult *= 0.1;
			}
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

	const ___decoder = new TextDecoder();
	const de = ___decoder.decode.bind(___decoder);

	function ParseSUBFile(data = new Uint8Array(0), settings = {
		noBlankSubtitles: true
	}) {
		const sub = data.subarray.bind(data);

		const subtitles = [];
		const len = data.length;
		let pointer = 0;

		const {noBlankSubtitles} = settings;
		let skipBadStep = true;
		while (pointer < len) {
			// If there is garbage data, many parsing systems would throw an error. But that's not very convenient, so we'll just ignore the garbage data.
			if (skipBadStep) {pointer = __skipBadData(data, pointer, len);skipBadStep = true;}

			let fakeUnits = [];
			let parse = __parseDouble(data, pointer, len);
			const timeStart = parse[1]/30;
			pointer = parse[0];
			while (__sepLookup[data[pointer]]) pointer++; // Normally, timestamps are captured by curly braces { and }, but they can also seem to be the opposite

			parse = __parseDouble(data, pointer, len);
			const timeEnd = parse[1]/30;
			pointer = parse[0];
			while (__sepLookup[data[pointer]]) pointer++; // Normally, timestamps are captured by curly braces { and }, but they can also seem to be the opposite

			oldPointer = pointer;
			for (; pointer < len; pointer++) {
				if (data[pointer] === 13) pointer++; // \r
				if (data[pointer] === 10) break;
				newlineNum = 0;
			}
			const text = de(sub(oldPointer, pointer));
			if (!noBlankSubtitles || text) subtitles.push(new SUBSubtitle(text, timeStart, timeEnd));
		}

		const lastSubtitle = subtitles[subtitles.length - 1];
		if (lastSubtitle.text === "" && isNaN(lastSubtitle.start) && isNaN(lastSubtitle.end)) {
			subtitles.pop();
		}

		return subtitles.sort((x,y)=>x.start - y.start);
	}

	function ExportFromSubtitles(subtitles = [], __isAlreadySorted = true) {
		if (!__isAlreadySorted) subtitles = subtitles.sort((x,y)=>x.start - y.start);
		const len = subtitles.length;
		const binaryData = [];
		for (let i = 0; i < len; i++) {
			const subtitle = subtitles[i];
			const data = ["{",subtitle.start*30, "}{", subtitle.end*30, "}", subtitle.text].join("\n");
			binaryData.push(data);
		}
		return binaryData.join("\n\n");
	}

	return {
		SUBSubtitle,
		ParseSUBFile,
		ExportFromSubtitles
	}
})();
