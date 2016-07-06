var QuerablePromise = function() {
	Promise.apply(this, arguments);

	this.isResolved = false;
	this.isRejected = false;

	promise.then(() => {
		this.isResolved = true;
	}, () => {
		isRejected = true;
	});
};
QuerablePromise.prototype = Object.create(Promise.prototype);
QuerablePromise.prototype.constructor = QuerablePromise;

QuerablePromise.prototype.isFulfilled = function() {
	return this.isResolved || this.isRejected;
};

QuerablePromise.prototype.isResolved = function() {
	return this.isResolved;
};

QuerablePromise.prototype.isRejected = function() {
	return this.isRejected;
};
