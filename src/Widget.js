var Widget = function() {
	this.parent = null;
	// this.flags = 0;

	this.y = this.x = 0;
	this.height = this.width = 0;

	this.marginLeft = this.marginRight = this.marginTop = this.marginBottom = 0; // TODO move to layoutParams
	this.style = {}; // TODO move to layoutParams

	// this.measureCache = {}; // TODO
};
Widget.prototype.flags = 0;

var FLAG_LAYOUT_REQUIRED = Widget.FLAG_LAYOUT_REQUIRED = 0x1;
var FLAG_FOCUSED = Widget.FLAG_FOCUSED = 0x2;
var FOCUSABLE = 0x4;
var MEASURED_STATE_TOO_SMALL = 0x01000000;
var FOCUS_AFTER_DESCENDANTS = 0x40000;
var FOCUS_BEFORE_DESCENDANTS = 0x20000;
var FOCUS_BLOCK_DESCENDANTS = 0x60000;

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
	this.flags &= ~FLAG_LAYOUT_REQUIRED; // TODO maybe should not be here
};

Widget.prototype.layout = function() {
	throw new Error("Widget must override the layout method.");
};

Widget.prototype.isLayoutRequested = function() {
	return this.flags & FLAG_LAYOUT_REQUIRED;
};

// Invalidates this widget and upwards it's hierarchy.
Widget.prototype.requestLayout = Widget.prototype.invalidate = function() {
	this.flags |= FLAG_LAYOUT_REQUIRED;

	// this.measureCache = {}; // Flush the cache

	if (this.parent && !this.parent.isLayoutRequested()) {
		this.parent.requestLayout();
	}
};

Widget.prototype.isFocusable = function() {
	return this.flags & FOCUSABLE;
};

Widget.prototype.setFocusable = function(focusable) {
	if (focusable) this.flags |= FOCUSABLE;
	else this.flags &= ~FOCUSABLE;
};

Widget.prototype.hasFocus = function() {
	return this.flags & FLAG_FOCUSED;
};

/**
 * Blurs the widget.
 */
Widget.prototype.blur = Widget.prototype.clearFocus = function(propagate) {
	if (this.flags & FLAG_FOCUSED) {
		this.flags &= ~FLAG_FOCUSED;

		if (propagate && this.parent !== null) {
			this.parent.clearChildFocus(this);
		}
	}
};

Widget.prototype.requestFocus = function() {
	if ((this.flags & FOCUSABLE) !== FOCUSABLE) {
		return false;
	}
	// If an ancestor is blocking focus
	var parent = this.getParent();
	while (parent !== null) {
		if (parent.getDescendantFocusability() === FOCUS_BLOCK_DESCENDANTS) return false;
		parent = parent.getParent();
	}
	if ((this.flags & FLAG_FOCUSED) === 0) {
		this.flags |= FLAG_FOCUSED;

		if (this.parent) {
			this.parent.requestChildFocus(this);
		}
	}
	return true;
};

Widget.prototype.margin = function(value) {
	this.marginLeft = this.marginRight = this.marginTop = this.marginBottom = value;
};

Widget.prototype.getRootWidget = function() {
	var parent = this;
	while (parent.getParent() !== null) {
		parent = parent.getParent();
	}
	return parent;
};

module.exports = Widget;
