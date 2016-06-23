var Widget = require("Widget.js");
var renderer = require("renderer.js");
var measureSpec = require("measureSpec.js");

var gl = renderer.gl;

var LoadingScreen = function() {
	Widget.call(this);
};
LoadingScreen.prototype = Object.create(Widget.prototype);
LoadingScreen.prototype.constructor = LoadingScreen;

LoadingScreen.prototype.layout = function(widthMeasureSpec, heightMeasureSpec) {
	var width = 0, height = 0;
	if (measureSpec.getMode(widthMeasureSpec) === measureSpec.EXACTLY) width = measureSpec.getSize(widthMeasureSpec);
	if (measureSpec.getMode(heightMeasureSpec) === measureSpec.EXACTLY) height = measureSpec.getSize(heightMeasureSpec);
	this.setDimension(width, height);
};

LoadingScreen.prototype.draw = function(dt, time, batch) {
	gl.clearColor(1.0, 0.0, 1.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);
};

module.exports = LoadingScreen;
