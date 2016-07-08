var equal = require("equals");

/**
 * Exports a function that given a target returns a proxy that caches all
 * returned values of method invocations.
 */
module.exports = function(target) {
	var cache = {};
	return new Proxy(target, {
		get: function(target, property, receiver) {
			let value = target[property];

			if (typeof value === "function") {
				return function() {
					var functionCache = cache[property];
					if (functionCache) {
						for (var i = 0, length = functionCache.length; i < length; ++i) {
							var entry = functionCache[i];
							if (equal(arguments, entry.args)) {
								console.log("Intercepted", value, "invocation with", arguments, "for cached value.");
								return entry.result;
							}
						}
					} else cache[property] = [];
					var result = value.apply(this, arguments);
					cache[property].push({
						args: arguments,
						result: result
					});
					return result;
				};
			} else {
				return value;
			}
		}
	});
};
