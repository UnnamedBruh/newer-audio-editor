const Shine = (function() {
	const AMPEG = 0x1ad;
	const WAVE = 0xfb1;
	const DATA = 0xffd;

	const config = Object.create(null);

	function error(s) {
		throw new Error(s);
	}

	function printf(...s) {
		if (s.length === 1) {
			console.log(s[0]);
		} else {
			let i = 1;
			console.log(s[0].replace(/%\w/g, function() {
				return s[i++];
			}));
		}
	}

	let raw = false;

	function print_usage() {
		printf("USAGE   :  [options] <infile> <outfile>\n");
		printf("options : -h            this help message\n");
		printf("          -b <bitrate>  set the bitrate [32-320], default 128kbit\n");
		printf("          -c            set copyright flag, default off\n");
		printf("          -r            raw cd data file instead of wave\n");
		printf("");
	}

	function set_defaults() {
		config.mpeg = Object.create(null);
		config.mpeg.type = 1;
		config.mpeg.layr = 2;
		config.mpeg.mode = 2;
		config.mpeg.bitr = 128;
		config.mpeg.psyc = 2;
		config.mpeg.emph = 0; 
		config.mpeg.crc  = 0;
		config.mpeg.ext  = 0;
		config.mpeg.mode_ext  = 0;
		config.mpeg.copyright = 0;
		config.mpeg.original  = 1;
	}

	const ASCIILOOKUP = new Uint8Array([16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,0,1,2,3,4,5,6,7,8,9,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16]);

	function __atoi(str, offset = 0) {
		const bytes = new TextEncoder().encode(str);
		let i = offset;
		for (; i < bytes.length && bytes[i] < 48 && bytes[i] > 57; i++) {}

		let count = 0;
		let lookup = ASCIILOOKUP[bytes[i]];

		for (; i < bytes.length && !(lookup & 0x10); i++) {
			lookup = ASCIILOOKUP[bytes[i]];
			count = count * 10 + lookup;
		}

		return count;
	}

	function parse_command(argc, arguments) {
		let i = 0;
		if (argc < 3) return false;
		while (arguments[i++][0] === "-") {
			switch (arguments[i][1]) {
				case "b": {
					config.mpeg.bitr = __atoi(argv[++i], 2);
					break;
				}
				case "c": {
					config.mpeg.copyright = 1;
					break;
				}
				case "r": {
					raw = true;
					break;
				}
				default: {
					return false;
				}
			}
		}
		if ((argc - i) !== 2) return false;
		config.infile  = argv[i++];
		config.outfile = argv[i];
		return true;
	}

	const mpeg1_sampleRate = new Int16Array([44100,48000,32000]);
	const mpeg1_bitrate = new Int16Array([0,32,40,48,56,64,80,96,112,128,160,192,224,256,320]);
	const mode_names    = [ "stereo", "j-stereo", "dual-ch", "mono" ];
	const layer_names   = [ "I", "II", "III" ];
	const version_names = [ "MPEG-II (LSF)", "MPEG-I" ];
	const psy_names     = [ "", "MUSICAM", "Shine" ];
	const demp_names    = [ "none", "50/15us", "", "CITT" ];

	function find_samplerate_index(freq) {
		let i = 0;
		for(i=0;i<3;i++)if(freq==mpeg1_sampleRate[i])return i;
		error("Invalid samplerate");
	}

	function find_bitrate_index(freq) {
		let i = 0;
		for(i=0;i<15;i++)if(freq==mpeg1_bitrate[i])return i;
		error("Invalid bitrate");
	}

	function check_config() {
		config.mpeg.samplerate_index = find_samplerate_index(config.wave.samplerate);
		config.mpeg.bitrate_index    = find_bitrate_index(config.mpeg.bitr);

		printf("%s layer %s, %s  Psychoacoustic Model: %s\n", version_names[config.mpeg.type], layer_names[config.mpeg.layr],  mode_names[config.mpeg.mode], psy_names[config.mpeg.psyc]);
  		printf("Bitrate=%d kbps  ",config.mpeg.bitr );
  		printf("De-emphasis: %s   %s %s\n", demp_names[config.mpeg.emph], ((config.mpeg.original)?"Original":""), ((config.mpeg.copyright)?"(C)":""));
	}

	function main(string = "", disk = Object.create(null)) {
		let arguments = [];
		let argc = 0;
		{
			arguments = string.match(/"[^"]+"|\S+/g) || [];
			argc = arguments.length;
		}
		printf("ARM Shine v1.00(SA) 24/03/01\n");
		set_defaults();

		if (!parse_command(arguments, argc)) {
			print_usage();
			throw new Error("EXIT CODE 1");
		}

		filetype = readtype(config.infile);

		if (raw) wave_open(DATA); else {
			switch(filetype) {
				case WAVE:
				case DATA:
					wave_open(filetype);
					break;
				default: wave_open(WAVE);
			}
		}

		check_config();

		printf("Encoding \"%s\" to \"%s\"\n", config.infile, config.outfile);
        
		L3_compress();

		wave_close();

		console.warn("This is not a part of the original C library. The time debugging is temporarily unimplemented in this port.");
	}

	main.out = Object.create(null);

	return main;
})();
