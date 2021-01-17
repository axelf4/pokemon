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

	let {texture: {width: texWidth, height: texHeight}, u1, v1, u2, v2} = this.region,
		w = (u2 - u1) * texWidth, h = (v2 - v1) * texHeight,
		desiredAspect = w / h;

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
	let x = this.x + this.imageX, y = this.y + this.imageY;
	this.region.draw(batch, x, y, x + this.width, y + this.height);
};

module.exports = Image;
