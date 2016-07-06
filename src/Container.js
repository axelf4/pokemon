var Widget = require("Widget.js");
var WidgetGroup = require("WidgetGroup.js");
var measureSpec = require("measureSpec.js");

var Container = function() {
	WidgetGroup.call(this);
	this.background = null;
};
Container.prototype = Object.create(WidgetGroup.prototype);
Container.prototype.constructor = Container;

Container.prototype.layout = function(widthMeasureSpec, heightMeasureSpec) {
	if (this.children.length !== 1) throw new Error("A container shall only have one child, since it is from China.");
	var child = this.children[0];

	var widthMode = measureSpec.getMode(widthMeasureSpec);
	var heightMode = measureSpec.getMode(heightMeasureSpec);
	var widthSize = measureSpec.getSize(widthMeasureSpec);
	var heightSize = measureSpec.getSize(heightMeasureSpec);

	var marginRow = child.marginLeft + child.marginRight;
	var marginColumn = child.marginTop + child.marginBottom;

	var childWidthMeasureSpec, childHeightMeasureSpec;
	childWidthMeasureSpec = measureSpec.adjust(widthMeasureSpec, -marginRow);
	childHeightMeasureSpec = measureSpec.adjust(heightMeasureSpec, -marginColumn);
	child.layout(childWidthMeasureSpec, childHeightMeasureSpec);

	// TODO handle aligning
	child.setPosition(child.marginLeft, child.marginTop);

	this.setDimension(child.width + marginRow, child.height + marginColumn);
};

Container.prototype.draw = function(batch, dt, time) {
	if (this.background) {
		this.background.draw(batch, this.x, this.y, this.width, this.height);
	}

	this.drawChildren(batch, dt, time);
};

Container.prototype.setBackground = function(background) {
	this.background = background;
};

module.exports = Container;