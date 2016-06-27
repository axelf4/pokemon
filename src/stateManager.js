var state = null;

exports.getState = function() {
	return state;
};

exports.setState = function(value) {
	if (!value) throw new ReferenceError("The specified state cannot be null.");
	state = value;
};
