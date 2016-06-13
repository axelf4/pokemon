var Widget = require("Widget.js");
var glMatrix = require("gl-matrix");

var vec3 = glMatrix.vec3;
var mat4 = glMatrix.mat4;

var WidgetGroup = function() {
	Widget.call(this);
	this.children = [];
};
WidgetGroup.prototype = Object.create(Widget.prototype);
WidgetGroup.prototype.constructor = WidgetGroup;

WidgetGroup.prototype.addWidget = function(child) {
	if (child.parent) throw new Error("Widget already had parrent.");
	this.children.push(child);
	this.invalidate();
	child.parent = this;
};

WidgetGroup.prototype.removeWidget = function(child) {
	var i = this.children.indexOf(child);
	this.children.splice(i, 1);
	this.invalidate();
	child.parent = null;
};

WidgetGroup.prototype.update = function(dt, time) {
	for (var i = 0, length = this.children.length; i < length; ++i) {
		this.children[i].update(dt, time);
	}
};

WidgetGroup.prototype.drawChildren = function(batch, dt, time) {
	var oldMatrix = batch.getMVMatrix();
	var transform = mat4.create();
	mat4.fromTranslation(transform, vec3.fromValues(this.x, this.y, 0));
	batch.setMVMatrix(transform);

	for (var i = 0, length = this.children.length; i < length; ++i) {
		this.children[i].draw(batch, dt, time);
	}

	batch.setMVMatrix(oldMatrix);
};

module.exports = WidgetGroup;
