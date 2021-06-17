#!/usr/bin/env python3
# Try to locate the loop segments in the given audio file.
#
# Since gbsplay does not expose what jumps are done when and where, we
# must try to infer it from the audio pattern.

import sys
import numpy as np
from scipy.signal import find_peaks
import soundfile as sf
import matplotlib.pyplot as plt

data, samplerate = sf.read(sys.argv[1], always_2d=True)
step = 85  # Only consider every step:th sample to speed up calculation
a = data[::step, 1].copy()


def autocorr(a):
    crossCorr = np.correlate(a, a, mode="same")
    return crossCorr[len(crossCorr) // 2 :]


# Find the duration of the loop segments
corr = autocorr(a)
b = np.maximum(0, corr) / np.max(corr[10000 // step :])  # Normalize to [0, 1]
peaks, _ = find_peaks(b, distance=5 * samplerate / step, prominence=0.4)
# peak_idx = 100 + np.argmax(corr[100:])
peak_idx = peaks[1]
loopDuration = peak_idx * step / samplerate
print(f"loopDuration: {loopDuration}")

# Next, find the duration of the intro
cost = np.fromiter(
    (
        -np.linalg.norm(a[i : i + peak_idx] - a[i + peak_idx : i + 2 * peak_idx])
        for i in range(len(a) - 2 * peak_idx)
    ),
    dtype=float,
)
# Could also try just argmax instead of find_peaks!
reach = np.max(cost) - np.min(cost)
peaks, _ = find_peaks(cost, distance=peak_idx / 2, prominence=reach / 3)
introDuration = peaks[0] * step / samplerate
# introDuration = np.argmax(cost) * step / samplerate
print(f"introDuration: {introDuration}")

plt.plot(cost)
plt.plot(peaks, cost[peaks], "x")
plt.show()
