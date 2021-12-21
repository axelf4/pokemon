import { mapValues, range, isPowerOfTwo, nextPowerOfTwo } from "./utils";

test("range should be inclusive/exclusive", () => {
	expect(range(1, 3)).toEqual([1, 2]);
});

test("can map the values of an object", () => {
	expect(mapValues({x: 0, y: 1}, x => x + 1)).toEqual({x: 1, y: 2});
});

describe("pow2 utilities", () => {
	test("treats zero/one as powers of two", () => {
		expect(isPowerOfTwo(0)).toBe(true);
		expect(isPowerOfTwo(1)).toBe(true);
	});

	test("can distinguish a power of two", () => {
		expect(isPowerOfTwo(15)).toBe(false);
		expect(isPowerOfTwo(64)).toBe(true);
	});

	test("can get the next power of two", () => {
		expect(nextPowerOfTwo(42)).toBe(64);
	});

	test("the next power of two of a power of two is itself", () => {
		expect(nextPowerOfTwo(0)).toBe(0);
		expect(nextPowerOfTwo(1)).toBe(1);
		expect(nextPowerOfTwo(16)).toBe(16);
	});
});
