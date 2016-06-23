var Widget = require("Widget.js");
var glMatrix = require("gl-matrix");

var vec3 = glMatrix.vec3;
var mat4 = glMatrix.mat4;

var WidgetGroup = function() {
	Widget.call(this);
	this.children = [];
	this.focused = false;
};
WidgetGroup.prototype = Object.create(Widget.prototype);
WidgetGroup.prototype.constructor = WidgetGroup;

WidgetGroup.prototype.addWidget = function(child) {
	if (child.parent !== null) throw new Error("The specified child already has a parent.");
	this.children.push(child);
	this.invalidate();
	child.parent = this;
};

WidgetGroup.prototype.removeWidget = function(child) {
	if (child === this.focused) this.focused = null;
	child.parent = null;
	var i = this.children.indexOf(child);
	this.children.splice(i, 1);
	this.invalidate();
};

WidgetGroup.removeAllWidgets = function() {
	this.focused = null;
	for (var i = 0, length = this.children.length; i < length; ++i) {
		this.children[i].parent = null;
	}
	this.children.clear();
	this.invalidate();
};

WidgetGroup.prototype.update = function(dt, time) {
	for (var i = 0, length = this.children.length; i < length; ++i) {
		var child = this.children[i];
		if (child && child.update) {
			child.update(dt, time);
		}
	}
};

WidgetGroup.prototype.onKey = function(type, keyCode) {
	if (this.focused) {
		this.focused.onKey(type, keyCode);
	}
};

WidgetGroup.prototype.drawChildren = function(batch, dt, time) {
	var oldMatrix = batch.getMVMatrix();
	var transform = mat4.create();
	mat4.fromTranslation(transform, vec3.fromValues(this.x, this.y, 0));
	var newMatrix = mat4.create();
	mat4.multiply(newMatrix, oldMatrix, transform);

	batch.setMVMatrix(newMatrix);

	for (var i = 0, length = this.children.length; i < length; ++i) {
		var child = this.children[i];
		child.draw(batch, dt, time);
	}

	batch.setMVMatrix(oldMatrix);
};

WidgetGroup.prototype.clearFocus = function() {
	Widget.prototype.clearFocus.call(this);
	if (this.focused !== null) {
		this.focused.clearFocus();
		this.focused = null;
	}
};

WidgetGroup.prototype.requestChildFocus = function(child) {
	if (this.focused !== child) {
		this.focused = child;
	}

	if (this.parent) {
		this.parent.requestChildFocus(this);
	}
};

module.exports = WidgetGroup;
