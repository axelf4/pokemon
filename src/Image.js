import Widget from "./Widget";
import * as measureSpec from "./measureSpec";
import {Mode} from "./measureSpec";
var align = require("align.js");

function resolveAdjustedSize(desiredSize, spec) {
	let size = measureSpec.getSize(spec),
		mode = measureSpec.getMode(spec);
	switch (mode) {
	case Mode.Unspecified:
		return desiredSize;
	case Mode.AtMost:
		return Math.min(desiredSize, size);
	case Mode.Exactly:
		return size;
	}
}

export default class Image extends Widget {
	constructor(region) {
		super();

		this.imageX = this.imageY = this.imageWidth = this.imageHeight = 0;
		this.align = align.CENTER;

		this.region = region;
	}

	setRegion(region) {
		this.region = region;
		this.invalidate();
	}

	layout(widthMeasureSpec, heightMeasureSpec) {
		var widthMode = measureSpec.getMode(widthMeasureSpec);
		var heightMode = measureSpec.getMode(heightMeasureSpec);

		var width, height;

		let {texture: {width: texWidth, height: texHeight}, u1, v1, u2, v2} = this.region,
			w = (u2 - u1) * texWidth, h = (v2 - v1) * texHeight,
			desiredAspect = w / h;

		var resizeWidth = widthMode != Mode.Exactly, resizeHeight = heightMode != Mode.Exactly;

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
	}

	draw(batch) {
		let x = this.x + this.imageX, y = this.y + this.imageY;
		this.region.draw(batch, x, y, x + this.width, y + this.height);
	}
}
