import * as renderer from "renderer";

let state = null;

export let getState = function() {
	return state;
};

export let setState = function(value) {
	if (!value) throw new ReferenceError("The specified state cannot be null.");
	state = value;
	let {width, height} = renderer.getSize();
	state.resize(width, height);
};
