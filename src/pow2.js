export const isPowerOfTwo = function(x) {
	return (x & (x - 1)) == 0;
};

export const nextPowerOfTwo = function(x) {
	--x;
	for (var i = 1; i < 32; i <<= 1) {
		x = x | x >> i;
	}
	return x + 1;
};
