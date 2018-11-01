var Widget = require("Widget.js");
var measureSpec = require("measureSpec.js");
var align = require("align.js");

var Image = function(region) {
	Widget.call(this);

	this.imageX = this.imageY = this.imageWidth = this.imageHeight = 0;
	this.align = align.CENTER;

	this.region = region;
};
Image.prototype = Object.create(Widget.prototype);
Image.prototype.constructor = Image;

Image.prototype.setRegion = function(region) {
	this.region = region;
	this.requestLayout();
};

var resolveAdjustedSize = function(desiredSize, spec) {
	var result;
	var specMode = measureSpec.getMode(spec);
	var specSize = measureSpec.getSize(spec);
	switch (specMode) {
	case measureSpec.UNSPECIFIED:
		result = desiredSize;
		break;
	case measureSpec.AT_MOST:
		result = Math.min(desiredSize, specSize);
		break;
	case measureSpec.EXACTLY:
		result = specSize;
		break;
	default:
		throw new Error("Bad measure specification.");
	}
	return result;
};

Image.prototype.layout = function(widthMeasureSpec, heightMeasureSpec) {
	var widthMode = measureSpec.getMode(widthMeasureSpec);
	var heightMode = measureSpec.getMode(heightMeasureSpec);

	var width, height;

	var w = this.region.x1 - this.region.x0, h = this.region.y1 - this.region.y0;
	var desiredAspect = w / h;

	var resizeWidth = widthMode != measureSpec.EXACTLY, resizeHeight = heightMode != measureSpec.EXACTLY;

	var widthSize, heightSize;

	if (resizeWidth || resizeHeight) {
		widthSize = resolveAdjustedSize(w, widthMeasureSpec);
		heightSize = resolveAdjustedSize(h, heightMeasureSpec);

		var actualAspect = widthSize / heightSize;
		if (desiredAspect !== actualAspect) {
			var done = false;
			if (resizeWidth) {
				var newWidth = desiredAspect * heightSize;
				if (!resizeHeight) {
					widthSize = resolveAdjustedSize(newWidth, widthMeasureSpec);
				}
				if (newWidth <= widthSize) {
					widthSize = newWidth;
					done = true;
				}
			}
			if (!done && resizeHeight) {
				var newHeight = widthSize / desiredAspect;
				if (!resizeWidth) {
					heightSize = resolveAdjustedSize(newHeight, heightMeasureSpec);
				}
				if (newHeight <= heightSize) {
					heightSize = newHeight;
				}
			}
		}
	} else {
		widthSize = resolveAdjustedSize(w, widthMeasureSpec);
		heightSize = resolveAdjustedSize(h, heightMeasureSpec);
	}

	this.setDimension(widthSize, heightSize);

	if (this.align & align.LEFT || widthSize <= w) {
		this.imageX = 0;
	} else if (align & align.RIGHT) {
		this.imageX = widthSize - w;
	} else {
		this.imageX = (widthSize - w) / 2;
	}

	if (this.align & align.TOP || heightSize <= h) {
		this.imageY = 0;
	} else if (align & align.BOTTOM) {
		this.imageY = heightSize - h;
	} else {
		this.imageY = (heightSize - h) / 2;
	}
};


Image.prototype.draw = function(batch) {
	var region = this.region;
	var u1 = (region.x0 + 0.5) / region.width;
	var v1 = (region.y0 + 0.5) / region.height;
	var u2 = (region.x1 - 0.5) / region.width;
	var v2 = (region.y1 - 0.5) / region.height;
	var x = this.x + this.imageX;
	var y = this.y + this.imageY;
	// var width = region.x1 - region.x0, height = region.y1 - region.y0;
	batch.draw(region.texture, x, y, x + this.width, y + this.height, u1, v1, u2, v2);
};

module.exports = Image;
