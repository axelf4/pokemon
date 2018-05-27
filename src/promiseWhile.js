export default function promiseWhile(condition, action) {
	return new Promise((resolve, reject) => {
		if (condition()) action().then(promiseWhile.bind(null, condition, action));
	});
};
