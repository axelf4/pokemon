/** Returns whether the specified integer is a power of two.
 *
 * @param x The number in question.
 * @return Whether it is a power of two.
 */
export function isPowerOfTwo(x: number): boolean {
	return (x & (x - 1)) == 0;
}

/** Returns the next power of two greater than the specified number. */
export function nextPowerOfTwo(x: number): number {
	--x;
	for (var i = 1; i < 32; i <<= 1) {
		x = x | x >> i;
	}
	return x + 1;
}
