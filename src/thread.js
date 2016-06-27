module.exports = function(fn) {
	var gen = fn();
	if (typeof gen.next !== "function") return;
	(function next(value) {
		var ret = gen.next(value);
		if (ret.done) return;

		var promise = ret.value;
		if (!promise || typeof promise.then !== "function") throw new Error("Returned value is not a promise.");
		promise.then(next);
	})();
};
