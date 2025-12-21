const VTT = (function() {
	const VTT_NORMAL = 0, VTT_BOLD = 1, VTT_ITALIC = 2, VTT_UNDERLINE = 3, VTT_STROKE = 4, VTT_SPEAKER = 5;

	class VTTTextNode {
		constructor(text, type, speak) {
			this.text = text;
			this.type = type;
			if (type === VTT_SPEAKER) this.speaker = speak;
		}
	}

	class VTTClasses {
		constructor(classes) {
			this.classes = classes;
		}
	}

	class VTTNote {
		constructor(text) {
			this.text = text;
		}
	}

	class VTTSubtitle {
		constructor(subtitleText = [new VTTTextNode("", VTT_NORMAL)], start = 0, end = 0) {
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

	function __skipBadData(data = new Uint8Array(0), offset = 0, len) {
		while (offset < len && __intLookup[data[offset++]] & 0x10) {}
		return offset;
	}

	function __skipWhitespace(data = new Uint8Array(0), offset = 0, len) {
		while (offset < len && __spaLookup[data[offset++]]) {}
		return offset;
	}

	const mapOfLetters = {
		98: VTT_BOLD, 105: VTT_ITALIC, 117: VTT_UNDERLINE, 115: VTT_STROKE
	}

	function ParseVTTFile(data = new Uint8Array(0), settings = {
		noBlankSubtitles: true
	}) {
		const subtitles = [];
		const len = data.length;
		let pointer = 0;
		const minusLen = len - 1;

		const {noBlankSubtitles} = settings;
		let skipBadStep = true;

		const names = Object.create(null);
		let numberOfNames = 0;
		let oldPointer = 0;

		function classNode(currentSubtitleContent) {
			pointer++;
			if (pointer < len && data[pointer] === 46) { // .
				pointer++;
			}
			pointer = __skipWhitespace(data, pointer, len);
			const node = new VTTClasses([]);
			oldPointer = pointer-1;
			for (; pointer < len; pointer++) {
				if (data[pointer] === 62) {
					const className = new TextDecoder().decode(data.subarray(oldPointer, pointer)).trimEnd();
					node.classes.push(className);
					break;
				} else if (data[pointer] === 46) { // .
					const className = new TextDecoder().decode(data.subarray(oldPointer, pointer)).trimEnd();
					node.classes.push(className);
					oldPointer = ++pointer;
				}
			}
			pointer++;
			currentSubtitleContent.push(node);
			oldPointer = pointer+1;
		}

		function classNodeEnd(currentSubtitleContent) {
			pointer++;
			currentSubtitleContent.push(new VTTClasses([]));
		}

		while (pointer < len) {
			// If there is garbage data, many parsing systems would throw an error. But that's not very convenient, so we'll just ignore the garbage data (including the WEBVTT header)
			if (skipBadStep) {pointer = __skipBadData(data, pointer, len);skipBadStep = true;}
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
					subtitles.push(new VTTSubtitle([], timeStart, timeEnd));
					skipBadStep = false; // Since we already encountered a number, we don't have to skip the "bad data".
					continue;
				}
			}

			oldPointer = pointer;
			let newlineNum = 0;
			const currentSubtitleContent = [];
			pointer--;
			let continueLoop = false;

			for (; pointer < len; pointer++) {
				continueLoop = false;
				if (data[pointer] === 13) pointer++; // \r
				if (data[pointer] === 10) { // \n
					newlineNum++;
					if (newlineNum >= 2) {
						break;
					} else continue;
				}
				else if (data[pointer] === 60) { // <
					const text = data.subarray(oldPointer-1, pointer + (data[pointer+2]===99?1:0));
					if (text.length) {
						let end = text.length;
						for (let i = end-1; end >= 0; end--) {
							if (text[end] < 10 || text[end] > 13) break; // Space or Tab
						}
						// Trimming out the additional newlines of `text`, while also keeping spaces and tabs at the end of `text`
						currentSubtitleContent.push(new VTTTextNode(new TextDecoder().decode(text.subarray(0, end)), VTT_NORMAL));
					}
					pointer++;
					if (pointer >= len) break;
					switch (data[pointer]) {
						case 47: {
							pointer++;
							if (data[pointer] === 99) { // c
								console.log("e");
								/*const text = data.subarray(oldPointer-1, pointer+1);
								if (text.length) {
									let end = text.length;
									for (let i = end-1; end >= 0; end--) {
										if (text[end] === 32 || text[end] === 9) break; // Space or Tab
									}
									// Trimming out the additional newlines of `text`, while also keeping spaces and tabs at the end of `text`
									currentSubtitleContent.push(new VTTTextNode(new TextDecoder().decode(text.subarray(0, end+2)), VTT_NORMAL));
								}*/
								classNodeEnd(currentSubtitleContent);
								node = new VTTTextNode("", VTT_NORMAL);
								oldPointer = (pointer+=2);
							}
							break;
						}
						case 99: { // Class (c)
							classNode(currentSubtitleContent);
							break;
						}
						case 118: { // Voice (v)
							pointer = __skipWhitespace(data, pointer + 1, len);
							const node = new VTTTextNode("", VTT_SPEAKER, "");
							oldPointer = pointer-1;
							for (; pointer < len; pointer++) {
								if (data[pointer] === 62) {
									const voice = new TextDecoder().decode(data.subarray(oldPointer, pointer)).trimEnd();
									if ((__index = names[voice])) node.speaker = __index; else node.speaker = (names[voice] = numberOfNames++);
									break;
								}
							}
							pointer++;
							oldPointer = pointer;
							while (pointer < len) {
								if (data[pointer] === 13) pointer++; // \r
								if (data[pointer] === 10) {newlineNum++;break;} // \n
								if (data[pointer] === 60) {
									pointer++;
									if (data[pointer] === 47) { // /
										console.log("f");
										pointer++;
										if (data[pointer] === 99) { // c
											node.text = new TextDecoder().decode(data.subarray(oldPointer, setPointer+2));
											classNodeEnd(currentSubtitleContent);
											currentSubtitleContent.push(node);
											node = new VTTTextNode("", mapOfLetters[l]);
											oldPointer = pointer;
											continue;
										}
									}
								}
								pointer++;
							}
							node.text = new TextDecoder().decode(data.subarray(oldPointer, pointer - 1));
							currentSubtitleContent.push(node);
							oldPointer = pointer+1;
							continueLoop = true;
							break;
						}
						default: {
							const l = data[pointer++];
							let node = new VTTTextNode("", mapOfLetters[l]);
							if (data[pointer] === 62) pointer++;
							oldPointer = pointer;
							let setPointer = pointer;
							while (pointer < len) {
								if (data[pointer] === 13) pointer++; // \r
								if (data[pointer] === 10) {newlineNum++;break;} // \n
								else if (data[pointer] === 60) { // <
									setPointer = pointer;
									pointer++;
									if (pointer >= len) break;
									if (data[pointer] === 47) {
										pointer++;
										if (pointer >= len) break;
										if (data[pointer] === l) {
											pointer += 3;
											break;
										}
										if (data[pointer] === 99) { // c
											console.log("g");
											node.text = new TextDecoder().decode(data.subarray(oldPointer, setPointer));
											currentSubtitleContent.push(node);
											node = new VTTTextNode("", mapOfLetters[l]);
											oldPointer = ++pointer;
											classNodeEnd(currentSubtitleContent);
											continue;
										}
									} else if (data[pointer] === 99) {
										node.text = new TextDecoder().decode(data.subarray(oldPointer, setPointer));
										currentSubtitleContent.push(node);
										node = new VTTTextNode("", mapOfLetters[l]);
										oldPointer = pointer;
										classNode(currentSubtitleContent);
									}
								}
								pointer++;
								setPointer = pointer;
							}
							node.text = new TextDecoder().decode(data.subarray(oldPointer, setPointer));
							currentSubtitleContent.push(node);
							oldPointer = pointer;
							continueLoop = true;
							break;
						}
					}
				}
				if (continueLoop) continue;
				newlineNum = 0;
			}
			if (oldPointer < pointer) {
				const yyx = new TextDecoder().decode(data.subarray(oldPointer-1, pointer>=minusLen?pointer:pointer-1));
				if (yyx && yyx.trim()) currentSubtitleContent.push(new VTTTextNode(yyx, VTT_NORMAL));
			}
			subtitles.push(new VTTSubtitle(currentSubtitleContent, timeStart, timeEnd));
		}

		const lastSubtitle = subtitles[subtitles.length - 1];
		if (!lastSubtitle.text.length && isNaN(lastSubtitle.start) && isNaN(lastSubtitle.end)) {
			subtitles.pop();
		}

		return {names: Object.keys(names), subtitles: subtitles.sort((x,y)=>x.start - y.start)};
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

	function ExportFromSubtitles(subtitles = [], __isAlreadySorted = true) { // Needs to handle VTT data now.
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
		VTTSubtitle,
		VTTTextNode,
		ParseVTTFile
	}
})();
