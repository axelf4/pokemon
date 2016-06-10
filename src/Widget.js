var Widget = function() {
	this.dirty = false;

	this.focused = false;
	this.parent = null;

	this.measuredWidth = this.measuredHeight = 0;

	this.x = 0;
	this.y = 0;
	this.width = 0;
	this.height = 0;
};

// Removes this widget from its parent.
Widget.prototype.remove = function() {
	this.getParent().removeWidget(this);
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
};

Widget.prototype.layout = function() {
	throw new Error("Widget must override the layout method.");
};

Widget.prototype.invalidate = function() {
	this.dirty = true;
};

Widget.prototype.invalidateHierarchy = function() {
	var widget = this;
	do {
		widget.invalidate();
	} while (widget = widget.getParent());
};

Widget.prototype.validate = function() {
	if (this.dirty) this.layout();
	this.dirty = false;
};

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

module.exports = Widget;
