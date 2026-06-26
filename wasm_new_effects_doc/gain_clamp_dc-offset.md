The cases are officially documented, exactly as the WASM module is internally optimized for the fused `Volume & Limits: Gain & Clamp & DC Offset` effect.

Note: All of these effect loops are branchless. 0, 1, and 2 are executed separately.
Optimizations:
- Each effect branch points to sets of instructions. They are dynamically selected based on the given parameters of this implementation.
- Instead of dividing, the implementation multiplies by reciprocals.
- Variables that hold 128-bit vectors, that store 4 floats are reused.

0. DC Offset (Before Gain + Clamp)
0-1. If `dcOffsetBeforeGain` and `dcOffset != 0.0f`, apply a constant DC Offset to the waveform via `f32x4.add`.
0-2. Else, continue to step 1.

1. Gain + Clamp
Warning: The ability to handle NaN samples is toggled via `handleNaNs`. In implementations of the Web Audio API, many HTML browsers, operating systems or sound devices handle `NaN`, so not handling `NaN`s is neglible. This becomes a tradeoff because some legacy systems may not properly handle `NaN` samples, so clearing them *accidentally* addresses that risk. But engineerers might prefer `NaN` not to be overwritten for granular preservation or precision.
1-0-0. If `gain == 0`...
1-0-0-0. If `handleNaNs`, each sample's bytes are zeroed out if they are ordered, and kept as-is if not. This is done via `f32x4.eq` and `v128.andnot` in WebAssembly. For an example, `8.0f == 8.0f` passes, because `8.0` is an ordered value according to the IEEE 754 Floating Point standard. `NaN != NaN` passes, because the standard specifies that `NaN` is an *unordered* value; comparing any value to `NaN` must return `false`, except the `Not Equals` operator which must return `true`.
1-0-0-1. Else, zero out every byte of the audio data (`memset` in C). WebAssembly uses the IEEE 754 Floating Point standard, so this works as intended.
1-0-1. If `mode == 0`, continue to step 1-1. If `mode == 1`, continue to step 1-2. If `mode == 2`, continue to step 1-3. If `mode == 3`, continue to step 1-4. Else, continue to step 2.

1-1. No Clipping Selected
1-1-0. If `gain == 1`, the effect skips to 2.
1-1-1. If `gain == -1`, the effect negates the audio phase via `f32x4.neg`.
1-1-2. Else, the effect amplifies or attenuates the audio by `gain` via `f32x4.mul`.

Note: This effect produces odd harmonics, and may boost low frequencies and/or attenuate high frequencies.
1-2. Hard Clipping Selected
1-2-0. If `gain == 1`, the effect clamps the audio within `[min, max]` via `f32x4.min` and `f32x4.max`.
1-2-1. Else, the effect amplifies or attenuates the audio by `gain` via `f32x4.mul`, then clamps the audio within `[min, max]` via `f32x4.min` and `f32x4.max`.

Note: The effect below uses a practice known as "wave-folding", which may produce high transients, and/or series of odd and even harmonics.
1-3. Modulo Wrap Selected
1-3-0. If `gain == 1 && min == -1.0f && max == 1.0f`, the effect computes the truncated modulo (`fmodf` in C) of every audio sample by `2`.
1-3-1. If `gain == 1`, the effect scales it into `[min, max]`, then computes the truncated modulo (`fmodf` in C) of it by `max - min`, then scales it back into the `[-1.0, 1.0]` range. "It" refers to the audio sample in a loop iteration of every sample.
1-3-2. If `min == -1.0f && max == 1.0f`, the effect amplifies or attenuates the audio by `gain` via `f32x4.mul`, then computes the truncated modulo (`fmodf` in C) of every audio sample by `2`.
1-3-3. Else, the effect amplifies or attenuates the audio by `gain` via `f32x4.mul`, then the effect scales it into `[min, max]`, then computes the truncated modulo (`fmodf` in C) of it by `max - min`, then scales it back into the `[-1.0, 1.0]` range. "It" refers to the audio sample in a loop iteration of every sample.

Note: The effect below may produce smooth or noticeable transients similar to a Triangle Wave. This is recommended when volume boosting is expected to produce harsh artifacts, *and* speed is a priority.
1-4. Triangular Bouncing
1-4-0. If `gain == 1`, the effect warps each sample around a range (via triangular bouncing) on each audio sample.
1-4-1. Else, the effect amplifies or attenuates the audio by `gain` via `f32x4.mul`, then warps each sample around a range (via triangular bouncing) on each audio sample.

2. DC Offset
2-0. If `!dcOffsetBeforeGain` and `dcOffset != 0.0f`, apply a constant DC Offset to the waveform via `f32x4.add`.
2-1. Else, exit.
