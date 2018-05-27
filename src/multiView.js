export default function(...objects) {
	return new Proxy({}, {
		has(target, key) {
			return objects.some(x => key in x) || Reflect.has(...arguments);
		},
		get(target, key) {
			if (!Number.isNaN(+key)) return objects[key];
			for (let object of objects) {
				if (key in object) return object[key];
			}
			return Reflect.get(...arguments);
		},
		set(target, key, value) {
			for (let object of objects) {
				if (key in object) {
					object[key] = value;
					return true;
				}
			}
			return Reflect.set(...arguments);
		},
	});
}
