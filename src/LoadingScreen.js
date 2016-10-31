import State from "State";
var renderer = require("renderer.js");
var measureSpec = require("measureSpec.js");

var gl = renderer.gl;

export default class LoadingScreen extends State {
	draw(batch, dt, time) {
		gl.clearColor(1.0, 0.0, 1.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
	}
}
