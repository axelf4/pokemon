/** @file Miscellaneous utilities. */

export function mapValues<T extends object, V>(
	obj: T,
	f: (v: T[keyof T]) => V
): {[K in keyof T]: V} {
	let res = {} as {[K in keyof T]: V};
	for (let k in obj)
		if (obj.hasOwnProperty(k))
			res[k] = f(obj[k]);
	return res;
}

export function unreachable(message?: string): never {
	throw new Error(message);
}

export function range(a: number, b?: number): Array<number> {
	if (b === undefined) {
		b = a;
		a = 0;
	}
	return Array.from({length: b - a}, (_v, i) => a + i);
}

/**
 * Returns `x` clamped to the inclusive range from `min` to `max`.
 *
 * @param x The value to be clamped.
 * @param min The lower bound of the result.
 * @param max The upper bound of the result.
 * @return `x` if `min` ≤ `x` ≤ max`, or `min` if `x` < `min` or `max` if `max` < `x`.
 */
export function clamp(x: number, min: number, max: number): number {
	return Math.min(Math.max(min, x), max);
}

/** Returns whether the specified integer is a power of two.
 *
 * @param x The number in question.
 * @return Whether it is a power of two.
 */
export function isPowerOfTwo(x: number): boolean {
	return (x & (x - 1)) == 0;
}

/** Returns the next power of two greater than or equal to the specified number. */
export function nextPowerOfTwo(x: number): number {
	--x;
	for (let i = 1; i < 32; i <<= 1)
		x = x | x >> i;
	return x + 1;
}

/**
 * Returns whether the given string consists of a single whitespace character.
 *
 * @param ch The string to test.
 * @return Whether it is only one whitespace char.
 */
export function isWhitespace(ch: string): boolean {
	return ch === ' ' || ch === '\t' || ch === '\n';
}

/**
 * Swap two elements of an array in-place.
 *
 * @param array The array.
 * @param a The index of the first element.
 * @param b The index of the second element.
 */
export function swapElements(array: any[], a: number, b: number): void {
	if (a === b) return;
	array[a] = array.splice(b, 1, array[a])[0];
}

/**
 * Promise version of <code>setTimeout</code>.
 *
 * @param delay The delay in milliseconds.
 * @param value Optionally, a value that the promise will resolve to.
 * @return A promise that resolves after the specified amount of time.
 */
export function wait<T>(delay: number, ...args: [T] | []): Promise<T> {
	return new Promise(resolve => setTimeout(resolve.bind(globalThis, ...args), delay));
}
