/**
 * Returns `x` clamped to the inclusive range of `min` and `max`.
 *
 * @param x The value to be clamped.
 * @param min The lower bound of the result.
 * @param max The upper bound of the result.
 * @return `x` if `min` ≤ `x` ≤ max`, or `min` if `x` < `min` or `max` if `max` < `x`.
 */
export default function clamp(x, min, max) {
	return Math.min(Math.max(min, x), max);
}
