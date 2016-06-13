var Widget = require("Widget.js");
var WidgetGroup = require("WidgetGroup.js");
var MeasureSpec = require("MeasureSpec.js");

var Stack = function() {
	WidgetGroup.call(this);
};
Stack.prototype = Object.create(WidgetGroup.prototype);
Stack.prototype.constructor = Stack;

Stack.prototype.layout = function(widthMeasureSpec, heightMeasureSpec) {
	var widthMode = widthMeasureSpec.getMode();
	var heightMode = heightMeasureSpec.getMode();
	var widthSize = widthMeasureSpec.getSize();
	var heightSize = heightMeasureSpec.getSize();

	var width = 0, height = 0;

	for (var i = 0, length = this.children.length; i < length; ++i) {
		var child = this.children[i];

		var marginRow = child.marginLeft + child.marginRight;
		var marginColumn = child.marginTop + child.marginBottom;

		var childWidthMeasureSpec, childHeightMeasureSpec;
		childWidthMeasureSpec = new MeasureSpec(widthMode, widthSize - marginRow);
		childHeightMeasureSpec = new MeasureSpec(heightMode, heightSize - marginColumn);
		child.layout(childWidthMeasureSpec, childHeightMeasureSpec);
		child.setPosition(child.marginLeft, child.marginTop);

		width = Math.max(width, child.width + marginRow);
		height = Math.max(height, child.height + marginColumn);
	}

	this.setDimension(width, height);
};

Stack.prototype.draw = function(batch, dt, time) {
	this.drawChildren(batch, dt, time);
};

module.exports = Stack;
