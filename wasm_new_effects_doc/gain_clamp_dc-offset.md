0. DC Offset (Before Gain + Clamp)
0-1. If `dcOffsetBeforeGain` and `dcOffset != 0.0f`, apply a constant DC Offset to the waveform via `f32x4.add`.
0-2. Else, goto to 1.

1. Gain + Clamp
1-0. If `mode == 0`, goto 1-1. If `mode == 1`, goto 1-2. If `mode == 2`, goto 1-3. If `mode == 3`, goto 1-4. Else, goto 2.

1-1. No Clipping Selected
1-1-1. If `gain == 1`, the effect skips to 2.
1-1-2. If `gain == -1`, the effect negates the audio phase via `f32x4.neg`.
1-1-3. Else, the effect amplifies or attenuates the audio by `gain` via `f32x4.mul`.

Note: This effect produces odd harmonics, and may boost low frequencies and/or attenuate high frequencies.
1-2. Hard Clipping Selected
1-2-1. If `gain == 1`, the effect clamps the audio within `[min, max]` via `f32x4.min` and `f32x4.max`.
1-2-2. Else, the effect amplifies or attenuates the audio by `gain` via `f32x4.mul`, then clamps the audio within `[min, max]` via `f32x4.min` and `f32x4.max`.

Note: The effect below may produce high transients, and/or series of odd and even harmonics.
1-3. Modulo Wrap Selected
1-3-1. If `gain == 1 && min == -1.0f && max == 1.0f`, the effect performs Euclidean division on every audio sample by `2`.
1-3-2. If `gain == 1`, the effect scales it into `[min, max]`, then performs Euclidean division on it by `max - min`, then scales it back into the `[-1.0, 1.0]` range. "It" refers to the audio sample in a loop iteration of every sample.
1-3-3. If `min == -1.0f && max == 1.0f`, the effect amplifies or attenuates the audio by `gain` via `f32x4.mul`, then performs Euclidean division on every audio sample by `2`.
1-3-4. Else, the effect amplifies or attenuates the audio by `gain` via `f32x4.mul`, then the effect scales it into `[min, max]`, then performs Euclidean division on it by `max - min`, then scales it back into the `[-1.0, 1.0]` range. "It" refers to the audio sample in a loop iteration of every sample.

Note: The effect below uses a practice known as "wave-folding", which may produce smooth or noticeable transients similar to a Triangle Wave. This is recommended when volume boosting is expected to produce harsh artifacts, *and* speed is a priority.
TODO: Clarify what 1-4-1 and 1-4-2 does
1-4. Triangular Bouncing
1-4-1. If `gain == 1`, the effect wraps each sample around a range on each audio sample.
1-4-2. Else, the effect amplifies or attenuates the audio by `gain` via `f32x4.mul`, then wraps each sample around a range on each audio sample.

2. DC Offset
2-1. If `!dcOffsetBeforeGain` and `dcOffset != 0.0f`, apply a constant DC Offset to the waveform via `f32x4.add`.
2-2. Else, exit.
