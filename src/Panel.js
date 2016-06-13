var WidgetGroup = require("WidgetGroup.js");
var MeasureSpec = require("MeasureSpec.js");

var dim = {
	'row': 'width',
	'column': 'height',
};
var pos = {
	'row': 'x',
	'column': 'y',
};
var DIRECTION_ROW = "row";
var DIRECTION_COLUMN = "column";
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

var getLeadingMargin = function(item, axis) {
	var value;
	switch (axis) {
		case DIRECTION_ROW: value = item.style.marginLeft; break;
		case DIRECTION_COLUMN: value = item.style.marginTop; break;
	}
	return value || 0;
};

var getTrailingMargin = function(item, axis) {
	var value;
	switch (axis) {
		case DIRECTION_ROW: value = item.style.marginRigth; break;
		case DIRECTION_COLUMN: value = item.style.marginBottom; break;
	}
	return value || 0;
};

var getMargin = function(item, axis) {
	return getLeadingMargin(item, axis) + getTrailingMargin(item, axis);
};

var isFlex = function(item) {
	return item.flex != undefined && item.flex !== 0;
};

var getPerpendicularAxis = function(axis) {
	if (axis == DIRECTION_ROW) return DIRECTION_COLUMN;
	if (axis == DIRECTION_COLUMN) return DIRECTION_ROW;
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


var clampDimension = function(node, axis, value) {
	var min = {
		'row': node.style.minWidth,
		'column': node.style.minHeight,
	}[axis];
	var max = {
		'row': node.style.maxWidth,
		'column': node.style.maxHeight,
	}[axis];

	var boundValue = value;
	if (max !== undefined && max >= 0 && boundValue > max) {
		boundValue = max;
	}
	if (min !== undefined && min >= 0 && boundValue < min) {
		boundValue = min;
	}
	return boundValue;
};

// When the user specifically sets a value for width or height
function setDimensionFromStyle(node, axis) {
	// The parent already computed us a width or height. We just skip it
	if (getLayoutSize(node, axis)) {
		return;
	}

	// We only run if there's a width or height defined
	if (!isStyleDimDefined(node, axis)) {
		return;
	}

	// The dimensions can never be smaller than the padding and border
	node[dim[axis]] = Math.max(node.style[dim[axis]], 0);
}

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

// no reordering with order
// overflow is undefined behavior
// ! Container properties
// direction: row | column, initial = row
// justify: flex-start | center | flex-end | space-between | space-around, initial = flex-start
// ! Child properties
// flex: <positive-number>, initial = 0
// align: flex-start | center | flex-end | stretch, initial = flex-start
// margin
// min-max
Panel.prototype.layout = function(widthMeasureSpec, heightMeasureSpec) {
	var mainAxis = this.direction, crossAxis = getPerpendicularAxis(mainAxis);
	setDimensionFromStyle(this, mainAxis);
	setDimensionFromStyle(this, crossAxis);

	var mainMeasureSpec = mainAxis === DIRECTION_ROW ? widthMeasureSpec : heightMeasureSpec;

	var availableWidth = widthMeasureSpec.getSize();
	var availableHeight = heightMeasureSpec.getSize();
	var availableMain = mainMeasureSpec.getSize();

	// Determine basis for each item
	var mainContentDim = 0;
	var sizeConsumed = 0; // Dimensions of the content in the main axis
	// var flexibleChildren = [];
	// var totalFlex = 0;
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
				childWidthMeasureSpec = new MeasureSpec(MeasureSpec.EXACTLY, item.style.width);
			} else if (crossAxis === DIRECTION_ROW && widthMeasureSpec.getMode() === MeasureSpec.EXACTLY && align === ALIGN_STRETCH) {
				childWidthMeasureSpec = new MeasureSpec(MeasureSpec.EXACTLY, widthMeasureSpec.getSize());
			} else if (widthMeasureSpec.getSize()) {
				childWidthMeasureSpec = new MeasureSpec(MeasureSpec.AT_MOST, widthMeasureSpec.getSize());
			} else {
				childWidthMeasureSpec = new MeasureSpec(MeasureSpec.UNSPECIFIED, undefined);
			}

			if (isStyleDimDefined(item, DIRECTION_COLUMN)) {
				childHeightMeasureSpec = new MeasureSpec(MeasureSpec.EXACTLY, item.style.height);
			} else if (crossAxis === DIRECTION_COLUMN && heightMeasureSpec.getMode() === MeasureSpec.EXACTLY && align === ALIGN_STRETCH) {
				childHeightMeasureSpec = new MeasureSpec(MeasureSpec.EXACTLY, heightMeasureSpec.getSize());
			} else if (heightMeasureSpec.getSize()) {
				childHeightMeasureSpec = new MeasureSpec(MeasureSpec.AT_MOST, heightMeasureSpec.getSize());
			} else {
				childHeightMeasureSpec = new MeasureSpec(MeasureSpec.UNSPECIFIED, undefined);
			}

			// Measure the child
			item.layout(childWidthMeasureSpec, childHeightMeasureSpec);
			item.basis = getLayoutSize(item, mainAxis);
		}

		sizeConsumed += item.basis + getMargin(item, mainAxis);
		mainContentDim += getDimWithMargin(item, mainAxis);

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
			childWidthMeasureSpec = new MeasureSpec(MeasureSpec.EXACTLY, updatedMainSize);

			if (isStyleDimDefined(item, DIRECTION_COLUMN)) {
				childHeightMeasureSpec = new MeasureSpec(MeasureSpec.EXACTLY, item.style.height);
			} else if (availableHeight && heightMeasureSpec.getMode() === MeasureSpec.EXACTLY && getAlignItem(item) === ALIGN_STRETCH) {
				childHeightMeasureSpec = new MeasureSpec(MeasureSpec.EXACTLY, availableHeight);
			} else {
				childHeightMeasureSpec = new MeasureSpec(availableHeight ? MeasureSpec.AT_MOST : MeasureSpec.UNSPECIFIED, availableHeight);
			}
		} else {
			childHeightMeasureSpec = new MeasureSpec(MeasureSpec.EXACTLY, updatedMainSize);

			if (isStyleDimDefined(item, DIRECTION_ROW)) {
				childWidthMeasureSpec = new MeasureSpec(MeasureSpec.EXACTLY, item.style.width);
			} else if (availableWidth && widthMeasureSpec.getMode() === MeasureSpec.EXACTLY && getAlignItem(item) === ALIGN_STRETCH) {
				childWidthMeasureSpec = new MeasureSpec(MeasureSpec.EXACTLY, availableWidth);
			} else {
				childWidthMeasureSpec = new MeasureSpec(availableWidth ? MeasureSpec.AT_MOST : MeasureSpec.UNSPECIFIED, availableWidth);
			}
		}
		item.layout(childWidthMeasureSpec, childHeightMeasureSpec);
	}
	if (totalFlexGrowFactors === 0 && remainingSpace > 0) {
		if (mainMeasureSpec.getMode() === MeasureSpec.AT_MOST) remainingSpace = 0;
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

	var mainMeasureSpec = mainAxis === DIRECTION_ROW ? widthMeasureSpec : heightMeasureSpec;
	if (mainMeasureSpec.getMode() === MeasureSpec.exactly) {
		mainSize = mainMeasureSpec.getSize();
	}
	var crossMeasureSpec = crossAxis === DIRECTION_ROW ? widthMeasureSpec : heightMeasureSpec;
	if (crossMeasureSpec.getMode() === MeasureSpec.exactly) {
		crossSize = crossMeasureSpec.getSize();
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
				var childWidthMeasureSpec = new MeasureSpec(childWidth ? MeasureSpec.EXACTLY : MeasureSpec.UNSPECIFIED, childWidth);
				var childHeightMeasureSpec = new MeasureSpec(childHeight ? MeasureSpec.EXACTLY : MeasureSpec.UNSPECIFIED, childHeight);
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
