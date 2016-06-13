var Widget = function() {
	this.parent = null;
	this.valid = false;
	this.focused = false;

	this.y = this.x = 0;
	this.height = this.width = 0;

	this.marginLeft = this.marginRight = this.marginTop = this.marginBottom = 0;

	this.style = {};
};

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
Widget.prototype.invalidate = function() {
	var widget = this;
	do {
		widget.valid = false;
	} while (widget = widget.getParent());
};

Widget.prototype.update = function() {};

Widget.prototype.focus = function() {
	// Make sure the parent is focused
	var parent = this;
	while (parent = parent.parent) {
		// Unfocus any siblings
		var siblings = parent.children;
		for (var i = 0, length = siblings.length; i < length; i++) {
			siblings[i].focused = false;
		}
		parent.focused = true;
	}
	this.focused = true; // Focus the widget
};

Widget.prototype.margin = function(value) {
	this.marginLeft = this.marginRight = this.marginTop = this.marginBottom = value;
};

module.exports = Widget;
