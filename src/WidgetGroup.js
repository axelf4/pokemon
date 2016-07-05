var Widget = require("Widget.js");
var glMatrix = require("gl-matrix");

var vec3 = glMatrix.vec3;
var mat4 = glMatrix.mat4;

var FLAG_CLIP_CHILDREN;
var FLAG_MASK_FOCUSABILITY = 0x60000;
var FOCUS_AFTER_DESCENDANTS = 0x40000;
var FOCUS_BEFORE_DESCENDANTS = 0x20000;
var FOCUS_BLOCK_DESCENDANTS = 0x60000;

var WidgetGroup = function() {
	Widget.call(this);
	this.children = [];
	this.focused = null; // The currently focused child or null
	this.groupFlags = 0;

	this.groupFlags |= FOCUS_BEFORE_DESCENDANTS;

	this.transform = mat4.create();
};
WidgetGroup.prototype = Object.create(Widget.prototype);
WidgetGroup.prototype.constructor = WidgetGroup;

WidgetGroup.FOCUS_AFTER_DESCENDANTS = FOCUS_AFTER_DESCENDANTS;
WidgetGroup.FOCUS_BEFORE_DESCENDANTS = FOCUS_BEFORE_DESCENDANTS;
WidgetGroup.FOCUS_BLOCK_DESCENDANTS = FOCUS_BLOCK_DESCENDANTS;

WidgetGroup.prototype.addWidget = function(child) {
	if (child.parent !== null) throw new Error("The specified child already has a parent.");
	this.children.push(child);
	this.invalidate();
	child.parent = this;
};

WidgetGroup.prototype.removeWidget = function(child) {
	var clearChildFocus = false;
	if (child === this.focused) {
		child.blur();
		clearChildFocus = true;
	}
	child.parent = null;
	var i = this.children.indexOf(child);
	this.children.splice(i, 1);
	this.invalidate();
	if (clearChildFocus) {
		this.clearChildFocus(child);
		this.getRootWidget().requestFocus();
	}
};

WidgetGroup.prototype.removeAllWidgets = function() {
	var clearChildFocus = false;
	var focused = this.focused;
	for (var i = 0, length = this.children.length; i < length; ++i) {
		var child = this.children[i];
		if (focused === child) {
			child.blur();
			clearChildFocus = true;
		}
		this.children[i].parent = null;
	}
	this.children = [];
	this.invalidate();
	if (clearChildFocus) {
		this.clearChildFocus(focused);
		this.getRootWidget().requestFocus();
	}
};

WidgetGroup.prototype.onKey = function(type, keyCode) {
	if (this.focused) {
		this.focused.onKey(type, keyCode);
	}
};

WidgetGroup.prototype.draw = WidgetGroup.prototype.drawChildren = function(batch, dt, time) {
	var setTransform = this.x !== 0 || this.y !== 0;
	if (setTransform) {
		var transform = this.transform;
		var oldMatrix = batch.getMVMatrix();
		mat4.fromTranslation(transform, vec3.fromValues(this.x, this.y, 0));
		mat4.multiply(transform, oldMatrix, transform);
		batch.setMVMatrix(transform);
	}

	for (var i = 0, length = this.children.length; i < length; ++i) {
		var child = this.children[i];
		child.draw(batch, dt, time);
	}

	if (setTransform) {
		batch.setMVMatrix(oldMatrix);
	}
};

WidgetGroup.prototype.clearFocus = function() {
	Widget.prototype.clearFocus.call(this);
	if (this.focused !== null) {
		this.focused.clearFocus();
		this.focused = null;
	}
};

WidgetGroup.prototype.clearChildFocus = function(child) {
	this.focused = null;
	if (this.parent !== null) {
		this.parent.clearChildFocus(this);
	}
};

WidgetGroup.prototype.requestChildFocus = function(child) {
	if (this.getDescendantFocusability() === FOCUS_BLOCK_DESCENDANTS) {
		return;
	}

	this.blur();

	if (this.focused !== child) {
		if (this.focused !== null) {
			this.focused.blur();
		}
		this.focused = child;
	}

	if (this.parent) {
		this.parent.requestChildFocus(this);
	}
};

/**
 * Returns the widget that currently has focus.
 */
WidgetGroup.prototype.getFocusedChild = function() {
	return this.focused;
};

WidgetGroup.prototype.hasFocus = function() {
	if (this.focused !== null) return true;
	return Widget.prototype.hasFocus.call(this);
};

WidgetGroup.prototype.hasFocusable = function() {
};

WidgetGroup.prototype.requestFocus = function() {
	var focusability = this.getDescendantFocusability();
	switch (focusability) {
		case FOCUS_BLOCK_DESCENDANTS:
			return Widget.prototype.requestFocus.call(this);
		case FOCUS_BEFORE_DESCENDANTS:
			var took = Widget.prototype.requestFocus.call(this);
			return took || this.onRequestFocusInDescendants();
		case FOCUS_AFTER_DESCENDANTS:
			var took = this.onRequestFocusInDescendants();
			return took || Widget.prototype.requestFocus.call(this);
		default:
			throw new Error("Invalid focusability.");
	}
};

WidgetGroup.prototype.onRequestFocusInDescendants = function() {
	for (var i = 0, length = this.children.length; i < length; ++i) {
		var widget = this.children[i];
		if (widget.requestFocus()) return true;
	}
	return false;
};

WidgetGroup.prototype.focusSearch = function(focused, direction) {
};

WidgetGroup.prototype.focusableAvailable = function(widget) {
};

WidgetGroup.prototype.getDescendantFocusability = function() {
	return this.groupFlags & FLAG_MASK_FOCUSABILITY;
};

WidgetGroup.prototype.setDescendantFocusability = function(focusability) {
	switch (focusability) {
		case FOCUS_BEFORE_DESCENDANTS:
		case FOCUS_AFTER_DESCENDANTS:
		case FOCUS_BLOCK_DESCENDANTS:
			break;
		default:
			throw new Error("Invalid argument.");
	}
	this.groupFlags = this.groupFlags & ~FLAG_MASK_FOCUSABILITY | focusability;
};

module.exports = WidgetGroup;
