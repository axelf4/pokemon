export default function(f, ...args) {
	var gen = f(...args);
	if (typeof gen.next !== "function") return; // throw new TypeError("The specified generator function is invalid.");

	(function next(value) {
		var ret = gen.next(value);
		if (ret.done) return;

		var promise = ret.value;
		if (!promise || typeof promise.then !== "function") throw new TypeError("Expression is not of type \"Promise\".");
		promise.then(next);
	})();
}
