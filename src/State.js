var Widget = require("Widget");
var measureSpec = require("measureSpec");
var renderer = require("renderer");

var State = function() {
	this.widget = null;
	this.width = -1;
	this.height = -1;
};

State.prototype.update = function(dt, time) {
};

State.prototype.draw = function(batch, dt, time) {
	if (this.widget && this.widget.flags & Widget.FLAG_LAYOUT_REQUIRED) {
		this.width = renderer.getWidth();
		this.height = renderer.getHeight();
		var widthMeasureSpec = measureSpec.make(this.width, measureSpec.EXACTLY);
		var heightMeasureSpec = measureSpec.make(this.height, measureSpec.EXACTLY);

		this.widget.layout(widthMeasureSpec, heightMeasureSpec);
	}

	this.widget.draw(batch, dt, time);
};

State.prototype.resize = function(width, height) {
	this.width = width;
	this.height = height;

	if (this.widget) {
		var widthMeasureSpec = measureSpec.make(width, measureSpec.EXACTLY);
		var heightMeasureSpec = measureSpec.make(height, measureSpec.EXACTLY);

		this.widget.layout(widthMeasureSpec, heightMeasureSpec);
	}
};

State.prototype.onKey = function(type, key) {
	if (this.widget) {
		this.widget.onKey(type, key);
	}
};

module.exports = State;
