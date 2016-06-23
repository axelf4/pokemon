var Widget = function() {
	this.parent = null;
	this.valid = false;
	this.focused = false;
	this.flags = 0;

	this.y = this.x = 0;
	this.height = this.width = 0;

	this.marginLeft = this.marginRight = this.marginTop = this.marginBottom = 0; // TODO move to layoutParams

	this.style = {}; // TODO remove
};

// TODO add layoutParams
var MEASURED_STATE_TOO_SMALL = 0x01000000;
var FLAG_LAYOUT_REQUIRED = 0x1;
var CLIP_TO_PADDING_MASK; // TODO
var FLAG_FOCUSED = Widget.FLAG_FOCUSED = 0x2;

// Removes this widget from its parent.
Widget.prototype.remove = function() {
	this.getParent().removeWidget(this);
	this.invalidate();
};

Widget.prototype.getParent = function() {
	return this.parent;
};

Widget.prototype.setPosition = function(x, y) {
	this.x = x;
	this.y = y;
};

Widget.prototype.setDimension = function(width, height) {
	this.width = width;
	this.height = height;
	this.valid = true; // TODO maybe should not be here
};

Widget.prototype.layout = function() {
	throw new Error("Widget must override the layout method.");
};

// Invalidates this widget and upwards it's hierarchy.
Widget.prototype.requestLayout = Widget.prototype.invalidate = function() {
	this.valid = false;

	if (this.parent) this.parent.invalidate();
};

// TODO remove
Widget.prototype.update = function() {};

Widget.prototype.clearFocus = function() {
	if (this.flags & FLAG_FOCUSED) {
		this.flags &= ~FLAG_FOCUSED;
	}
};

Widget.prototype.requestFocus = function() {
	if ((this.flags & FLAG_FOCUSED) === 0) {
		this.flags |= FLAG_FOCUSED;

		if (this.parent) {
			this.parent.requestChildFocus(this);
		}
	}
};

Widget.prototype.margin = function(value) {
	this.marginLeft = this.marginRight = this.marginTop = this.marginBottom = value;
};

module.exports = Widget;
