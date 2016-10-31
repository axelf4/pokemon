import equals from "equals";

/**
 * Exports a function that given a target returns a proxy that caches all
 * returned values of method invocations.
 */
export default function cachingProxy(target) {
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
							if (equals(arguments, entry.args)) {
								console.log("Intercepted", property, "invocation with", arguments, "for cache.");
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
}
