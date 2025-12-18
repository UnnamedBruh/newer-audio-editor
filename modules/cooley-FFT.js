// Imported from https://github.com/lvillasen/FFT.js/blob/main/FFT.js, altered by UnnamedBruh.

function FFT_IP(real, imag) { // I used GPT-5.0 Mini to optimize the original library (I struggled with optimizing the original without tampering)
	const N = real.length;
	if (N <= 1) return;

	const half = N / 2;
	let evenReal = new Float32Array(half);
	let evenImag = new Float32Array(half);
	let oddReal = new Float32Array(half);
	let oddImag = new Float32Array(half);
	let j = 0;
	for (let i = 0; i < half; i++, j++) {
		evenReal[i] = real[j];
		evenImag[i] = imag[j];
		oddReal[i]  = real[++j];
		oddImag[i]  = imag[j];
	}

	FFT_IP(evenReal, evenImag);
	FFT_IP(oddReal, oddImag);

	const y = 2 * Math.PI / N;
	const yn = -y;

	for (let k = 0, l = half; k < half; k++, l++) {
		const cosVal = Math.cos(y * k);
		const sinVal = Math.sin(yn * k);

		const tre = oddReal[k] * cosVal - oddImag[k] * sinVal;
		const tim = oddReal[k] * sinVal + oddImag[k] * cosVal;

		real[k] = evenReal[k] + tre;
		imag[k] = evenImag[k] + tim;
		real[l] = evenReal[k] - tre;
		imag[l] = evenImag[k] - tim;
	}
}
