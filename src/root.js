var MeasureSpec = require("MeasureSpec.js");

exports.width = -1;
exports.height = -1;

exports.valid = false;

exports.invalidate = function() {
	this.valid = false;
};

exports.setWidget = function(widget) {
	this.widget = widget;
	widget.parent = this;
	this.invalidate();
};

exports.traverse = function(desiredWidth, desiredHeight) {
	if (desiredWidth !== this.width || desiredHeight !== this.height) {
	   this.valid = false;
	}

	if (this.valid) return;

	if (!this.widget) return;

	var widthMeasureSpec = new MeasureSpec(MeasureSpec.EXACTLY, desiredWidth);
	var heightMeasureSpec = new MeasureSpec(MeasureSpec.EXACTLY, desiredHeight);
	this.widget.layout(widthMeasureSpec, heightMeasureSpec);

	this.valid = true;
};

exports.update = function(dt, time) {
	this.widget.update(dt, time);
};

exports.draw = function(batch, dt, time) {
	this.widget.draw(batch, dt, time);
};

exports.getParent = function() {
	return null;
};
