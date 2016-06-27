var State = require("State.js");
var renderer = require("renderer.js");
var measureSpec = require("measureSpec.js");

var gl = renderer.gl;

var LoadingScreen = function() {
	State.call(this);
};
LoadingScreen.prototype = Object.create(State.prototype);
LoadingScreen.prototype.constructor = LoadingScreen;

LoadingScreen.prototype.draw = function(batch, dt, time) {
	gl.clearColor(1.0, 0.0, 1.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);
};

module.exports = LoadingScreen;
