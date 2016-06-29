var measureSpec = require("measureSpec.js");

var State = function() {
	this.widget = null;
};

State.prototype.update = function(dt, time) {
};

State.prototype.draw = function(batch, dt, time) {
	this.widget.draw(batch, dt, time);
};

State.prototype.resize = function(width, height) {
	if (!this.widget) return;

	var widthMeasureSpec = measureSpec.make(width, measureSpec.EXACTLY);
	var heightMeasureSpec = measureSpec.make(height, measureSpec.EXACTLY);

	this.widget.layout(widthMeasureSpec, heightMeasureSpec);
};

State.prototype.onKey = function(type, key) {
	if (this.widget) {
		this.widget.onKey(type, key);
	}
};

module.exports = State;
