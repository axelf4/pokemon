var WidgetGroup = require("WidgetGroup.js");
var measureSpec = require("measureSpec.js");

var DIRECTION_ROW = 0;
var DIRECTION_COLUMN = 1;

var ALIGN_FLEX_START = 0;
var ALIGN_FLEX_END = 1;
var ALIGN_CENTER = 2;
var ALIGN_SPACE_BETWEEN = 3;
var ALIGN_SPACE_AROUND = 4;
var ALIGN_STRETCH = 5;

var Panel = function() {
	WidgetGroup.call(this);

	this.direction = DIRECTION_ROW;
	this.justify = ALIGN_FLEX_START;
};
Panel.prototype = Object.create(WidgetGroup.prototype);
Panel.prototype.constructor = Panel;

Panel.DIRECTION_ROW = DIRECTION_ROW;
Panel.DIRECTION_COLUMN = DIRECTION_COLUMN;
Panel.ALIGN_STRETCH = ALIGN_STRETCH;
Panel.ALIGN_FLEX_START = ALIGN_FLEX_START;
Panel.ALIGN_CENTER = ALIGN_CENTER;
Panel.ALIGN_FLEX_END = ALIGN_FLEX_END;
Panel.ALIGN_SPACE_BETWEEN = ALIGN_SPACE_BETWEEN;
Panel.ALIGN_SPACE_AROUND = ALIGN_SPACE_AROUND;

// Note: these depend on DIRECTION_ROW/COLUMN for indices
var pos = ['x', 'y'];
var dim = ['width', 'height'];

var getLeadingMargin = function(item, axis) {
	return axis === DIRECTION_ROW ? item.marginLeft : item.marginTop;
};

var getTrailingMargin = function(item, axis) {
	return axis === DIRECTION_ROW ? item.marginRight : item.marginBottom;
};

var getMargin = function(item, axis) {
	return getLeadingMargin(item, axis) + getTrailingMargin(item, axis);
};

var isFlex = function(item) {
	return item.flex != undefined && item.flex !== 0;
};

var getPerpendicularAxis = function(axis) {
	return axis === DIRECTION_ROW ? DIRECTION_COLUMN : DIRECTION_ROW;
};

var isRowAxis = function(axis) {
	return axis === DIRECTION_ROW;
};

var isColumnAxis = function(axis) {
	return axis === DIRECTION_COLUMN;
};

function isStyleDimDefined(node, axis) {
	return node.style[dim[axis]] !== undefined && node.style[dim[axis]] >= 0;
}

var getLayoutSize = function(item, axis) {
	return item[dim[axis]];
};

function getDimWithMargin(node, axis) {
	return node[dim[axis]] + getMargin(node, axis);
}

var getAlignItem = function(child) {
	if (child.style.align) return child.style.align; // TODO get rid of style property
	return ALIGN_FLEX_START;
};

var getFlex = function(node) {
	return node.flex || 0;
};

var isFlexBasisAuto = function(node) {
	return getFlex(node) <= 0;
};

var getFlexGrowFactor = function(node) {
	var flex = getFlex(node);
	if (flex > 0) return flex;
	return 0;
};

var getFlexShrinkFactor = function(node) {
	if (getFlex(node) < 0) return 1;
	return 0;
};

Panel.prototype.layout = function(widthMeasureSpec, heightMeasureSpec) {
	var widthMode = measureSpec.getMode(widthMeasureSpec);
	var heightMode = measureSpec.getMode(heightMeasureSpec);
	var widthSize = measureSpec.getSize(widthMeasureSpec);
	var heightSize = measureSpec.getSize(heightMeasureSpec);
	var mainAxis = this.direction, crossAxis = getPerpendicularAxis(mainAxis);

	var mainMeasureSpec = mainAxis === DIRECTION_ROW ? widthMeasureSpec : heightMeasureSpec;
	var availableMain = measureSpec.getSize(mainMeasureSpec);

	// Determine basis for each item
	var sizeConsumed = 0; // Dimensions of the content in the main axis
	var totalFlexGrowFactors = 0;
	var totalFlexShrinkScaledFactors = 0;

	for (var i = 0, length = this.children.length; i < length; i++) {
		var item = this.children[i];

		if (isStyleDimDefined(item, mainAxis)) {
			item.basis = item.style[dim[mainAxis]];
		} else if (!isFlexBasisAuto(item) && availableMain) {
			item.basis = 0;
		} else {
			// Determine the base size by performing layout
			var childWidthMeasureSpec, childHeightMeasureSpec;
			var align = getAlignItem(item);

			if (isStyleDimDefined(item, DIRECTION_ROW)) {
				childWidthMeasureSpec = measureSpec.make(item.style.width, measureSpec.EXACTLY);
			} else if (crossAxis === DIRECTION_ROW && widthMode === measureSpec.EXACTLY && align === ALIGN_STRETCH) {
				childWidthMeasureSpec = measureSpec.make(widthSize, measureSpec.EXACTLY);
			} else if (widthSize) {
				childWidthMeasureSpec = measureSpec.make(widthSize, measureSpec.AT_MOST);
			} else {
				childWidthMeasureSpec = measureSpec.make(0, measureSpec.UNSPECIFIED);
			}

			if (isStyleDimDefined(item, DIRECTION_COLUMN)) {
				childHeightMeasureSpec = measureSpec.make(item.style.height, measureSpec.EXACTLY);
			} else if (crossAxis === DIRECTION_COLUMN && heightMode === measureSpec.EXACTLY && align === ALIGN_STRETCH) {
				childHeightMeasureSpec = measureSpec.make(heightSize, measureSpec.EXACTLY);
			} else if (heightSize) {
				childHeightMeasureSpec = measureSpec.make(heightSize, measureSpec.AT_MOST);
			} else {
				childHeightMeasureSpec = measureSpec.make(0, measureSpec.UNSPECIFIED);
			}

			// Measure the child
			item.layout(childWidthMeasureSpec, childHeightMeasureSpec);
			item.basis = getLayoutSize(item, mainAxis);
		}

		sizeConsumed += item.basis + getMargin(item, mainAxis);

		if (isFlex(item)) {
			totalFlexGrowFactors += getFlexGrowFactor(item);
			totalFlexShrinkScaledFactors += getFlexShrinkFactor(item) * item.basis;
		}
	}

	// Layout flexible children and allocate empty space
	var leadingMainSize = 0;
	var betweenMain = 0;
	var remainingSpace = 0; // The remaining availible space in the main axis
	if (availableMain) remainingSpace = availableMain - sizeConsumed;
	for (var i = 0, length = this.children.length; i < length; ++i) {
		var item = this.children[i];
		var childBasis = item.basis;
		var updatedMainSize = childBasis;

		if (remainingSpace < 0) {
			var flexShrinkScaledFactor = getFlexShrinkFactor(item) * childBasis;
			if (flexShrinkScaledFactor !== 0) {
				updatedMainSize = childBasis + remainingSpace / totalFlexShrinkScaledFactors * flexShrinkScaledFactor;
			}
		} else if (remainingSpace > 0) {
			var flexGrowFactor = getFlexGrowFactor(item);
			if (flexGrowFactor !== 0) {
				updatedMainSize = childBasis + remainingSpace / totalFlexGrowFactors * flexGrowFactor;
			}
		}

		var childWidthMeasureSpec, childHeightMeasureSpec;
		if (mainAxis === DIRECTION_ROW) {
			childWidthMeasureSpec = measureSpec.make(updatedMainSize, measureSpec.EXACTLY);

			if (isStyleDimDefined(item, DIRECTION_COLUMN)) {
				childHeightMeasureSpec = measureSpec.make(item.style.height, measureSpec.EXACTLY);
			} else if (heightSize && heightMode === measureSpec.EXACTLY && getAlignItem(item) === ALIGN_STRETCH) {
				childHeightMeasureSpec = measureSpec.make(heightSize, measureSpec.EXACTLY);
			} else {
				var mode = heightSize ? measureSpec.AT_MOST : measureSpec.UNSPECIFIED;
				childHeightMeasureSpec = measureSpec.make(heightSize, mode);
			}
		} else {
			childHeightMeasureSpec = measureSpec.make(updatedMainSize, measureSpec.EXACTLY);

			if (isStyleDimDefined(item, DIRECTION_ROW)) {
				childWidthMeasureSpec = measureSpec.make(item.style.width, measureSpec.EXACTLY);
			} else if (widthSize && widthMode === measureSpec.EXACTLY && getAlignItem(item) === ALIGN_STRETCH) {
				childWidthMeasureSpec = measureSpec.make(widthSize, measureSpec.EXACTLY);
			} else {
				var mode = widthSize ? measureSpec.AT_MOST : measureSpec.UNSPECIFIED;
				childWidthMeasureSpec = measureSpec.make(widthSize, mode);
			}
		}
		item.layout(childWidthMeasureSpec, childHeightMeasureSpec);
	}
	if (totalFlexGrowFactors === 0 && remainingSpace > 0) {
		if (measureSpec.getMode(mainMeasureSpec) === measureSpec.AT_MOST) remainingSpace = 0;
		// Allocate remaining space according to justifyContent.
		switch (this.justify) {
			case ALIGN_FLEX_START: break;
			case ALIGN_CENTER:
				leadingMainSize = remainingSpace / 2;
				break;
			case ALIGN_FLEX_END:
				leadingMainSize = remainingSpace;
				break;
			case ALIGN_SPACE_BETWEEN:
				if (this.children.length - 1 !== 0) {
					betweenMain = remainingSpace / (this.children.length - 1);
				}
				break;
			case ALIGN_SPACE_AROUND:
				betweenMain = remainingSpace / this.children.length;
				leadingMainSize = betweenMain / 2;
				break;
			default:
				throw new Error("Invalid value for justifyContent.");
		}
	}

	var mainSize = leadingMainSize;
	var crossSize = 0;
	// Position elements in the main axis
	for (var i = 0, length = this.children.length; i < length; i++) {
		var item = this.children[i];
		item[pos[mainAxis]] = mainSize + getLeadingMargin(item, mainAxis);
		mainSize += betweenMain + getDimWithMargin(item, mainAxis);
		crossSize = Math.max(crossSize, getDimWithMargin(item, crossAxis));
	}

	// TODO cleanup this
	var mainMeasureSpec = mainAxis === DIRECTION_ROW ? widthMeasureSpec : heightMeasureSpec;
	if (measureSpec.getMode(mainMeasureSpec) === measureSpec.EXACTLY) {
		mainSize = measureSpec.getSize(mainMeasureSpec);
	}
	var crossMeasureSpec = crossAxis === DIRECTION_ROW ? widthMeasureSpec : heightMeasureSpec;
	if (measureSpec.getMode(crossMeasureSpec) === measureSpec.EXACTLY) {
		crossSize = measureSpec.getSize(crossMeasureSpec);
	}

	// Position elements in the cross axis
	for (var i = 0, length = this.children.length; i < length; i++) {
		var item = this.children[i];
		var leadingCrossDim = 0;
		var align = getAlignItem(item);
		if (align === ALIGN_STRETCH) {
			var childWidth = item.width;
			var childHeight = item.height;
			var isCrossSizeDefinite = false;
			if (mainAxis === DIRECTION_ROW) {
				isCrossSizeDefinite = isStyleDimDefined(item, DIRECTION_COLUMN);
				childHeight = crossSize - getMargin(item, DIRECTION_COLUMN);
			} else {
				isCrossSizeDefinite = isStyleDimDefined(item, DIRECTION_ROW);
				childWidth = crossSize - getMargin(item, DIRECTION_ROW);
			}
			if (!isCrossSizeDefinite) {
				var childWidthMeasureSpec = measureSpec.make(childWidth, childWidth ? measureSpec.EXACTLY : measureSpec.UNSPECIFIED);
				var childHeightMeasureSpec = measureSpec.make(childHeight, childHeight ? measureSpec.EXACTLY : measureSpec.UNSPECIFIED);
				item.layout(childWidthMeasureSpec, childHeightMeasureSpec);
			}
		} else if (align !== ALIGN_FLEX_START) {
			var remainingCrossDim = crossSize - getDimWithMargin(item, crossAxis);

			if (align === ALIGN_CENTER) leadingCrossDim += remainingCrossDim / 2;
			else if (align === ALIGN_FLEX_END) leadingCrossDim += remainingCrossDim;
			else throw new Error("Invalid align value.");
		}
		item[pos[crossAxis]] = leadingCrossDim + getLeadingMargin(item, crossAxis);
	}

	// Set the implicit width and height
	var measuredWidth = mainAxis === DIRECTION_ROW ? mainSize : crossSize;
	var measuredHeight = mainAxis === DIRECTION_ROW ? crossSize : mainSize;
	this.setDimension(measuredWidth, measuredHeight);
};

Panel.prototype.draw = function(batch, dt, time) {
	this.drawChildren(batch, dt, time);
};

module.exports = Panel;
