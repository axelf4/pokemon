// Miscellaneous utilities.

export function mapObject<T extends object, V>(
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
