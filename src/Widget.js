var Widget = function() {
	// TODO try without these
	this.width = 0;
	this.height = 0;
	this.top = 0;
	this.left = 0;

	this.children = [];
	this.focused = false;
	this.parent = null;
};

Widget.prototype.addWidget = function(child) {
	if (child.parent) throw new Error("Widget already had parrent.");
	this.children.push(child);
	this.dirty = true;
	child.parent = this;
};

Widget.prototype.removeWidget = function(child) {
	var i = this.children.indexOf(child);
	this.children.splice(i, 1);
	this.dirty = true;
	child.parent = null;
};

// Removes this widget from its parent.
Widget.prototype.remove = function() {
	this.getParent().removeWidget(this);
};

Widget.prototype.getParent = function() {
	return this.parent;
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
