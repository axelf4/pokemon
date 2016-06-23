var Widget = require("Widget.js");
var WidgetGroup = require("WidgetGroup.js");
var measureSpec = require("measureSpec.js");
var NinePatch = require("NinePatch.js");
var loader = require("loader.js");
var texture = require("texture.js");

// TODO move into skin
var ninePatchTexture, ninePatch;
loader.loadFile("textures/frame.9.png", function(file) {
	ninePatchTexture = new texture.Region();
	ninePatchTexture.loadFromFile(file, function() {
		ninePatch = NinePatch.fromTexture(ninePatchTexture.texture, 24, 24);
	});
});

var Container = function() {
	WidgetGroup.call(this);
	this.drawBackground = true; // Hack
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

	var childWidth = child.width, childHeight = child.height;
	this.setDimension(childWidth + marginRow, childHeight + marginColumn);
};

Container.prototype.draw = function(batch, dt, time) {
	if (ninePatch && this.drawBackground) {
		ninePatch.draw(batch, ninePatchTexture.texture, this.x, this.y, this.width, this.height);
	}

	this.drawChildren(batch, dt, time);
};

module.exports = Container;
