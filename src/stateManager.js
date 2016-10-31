const renderer = require("renderer");

let state = null;

export let getState = function() {
	return state;
};

export let setState = function(value) {
	if (!value) throw new ReferenceError("The specified state cannot be null.");
	state = value;
	state.resize(renderer.getWidth(), renderer.getHeight());
};
