import WidgetGroup from "WidgetGroup";
var measureSpec = require("measureSpec.js");

export const DIRECTION_ROW = 0,
	DIRECTION_COLUMN = 1,

	ALIGN_FLEX_START = 0,
	ALIGN_FLEX_END = 1,
	ALIGN_CENTER = 2,
	ALIGN_SPACE_BETWEEN = 3,
	ALIGN_SPACE_AROUND = 4,
	ALIGN_STRETCH = 5;

// Note: these depend on DIRECTION_ROW/COLUMN for indices
const pos = ['x', 'y'],
	dim = ['width', 'height'];

var getLeadingMargin = function(child, axis) {
	return axis === DIRECTION_ROW ? child.marginLeft : child.marginTop;
};

var getTrailingMargin = function(child, axis) {
	return axis === DIRECTION_ROW ? child.marginRight : child.marginBottom;
};

var getMargin = function(child, axis) {
	return getLeadingMargin(child, axis) + getTrailingMargin(child, axis);
};

var isFlex = function(child) {
	return child.flex != undefined && child.flex !== 0;
};

var getPerpendicularAxis = function(axis) {
	return axis === DIRECTION_ROW ? DIRECTION_COLUMN : DIRECTION_ROW;
};

var isStyleDimDefined = function(node, axis) {
	return node.style[dim[axis]];
}

var getLayoutSize = function(child, axis) {
	return child[dim[axis]];
};

var getDimWithMargin = function(node, axis) {
	return node[dim[axis]] + getMargin(node, axis);
};

var getAlign = function(child) {
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

export default class Panel extends WidgetGroup {
	constructor() {
		super();
		this.direction = DIRECTION_ROW;
		this.justify = ALIGN_FLEX_START;
	}

	layout(widthMeasureSpec, heightMeasureSpec) {
		var widthMode = measureSpec.getMode(widthMeasureSpec);
		var heightMode = measureSpec.getMode(heightMeasureSpec);
		var widthSize = measureSpec.getSize(widthMeasureSpec);
		var heightSize = measureSpec.getSize(heightMeasureSpec);
		var mainAxis = this.direction, crossAxis = getPerpendicularAxis(mainAxis);

		var mainMeasureSpec = mainAxis === DIRECTION_ROW ? widthMeasureSpec : heightMeasureSpec;
		var crossMeasureSpec = crossAxis === DIRECTION_ROW ? widthMeasureSpec : heightMeasureSpec;
		var availableMain = measureSpec.getSize(mainMeasureSpec);

		// Determine basis for each child
		var sizeConsumed = 0; // Dimensions of the content in the main axis
		var totalFlexGrowFactors = 0;
		var totalFlexShrinkScaledFactors = 0;
		for (var i = 0, length = this.children.length; i < length; i++) {
			var child = this.children[i];

			if (isStyleDimDefined(child, mainAxis)) {
				child.basis = child.style[dim[mainAxis]];
			} else if (!isFlexBasisAuto(child) && availableMain) {
				child.basis = 0;
			} else {
				// Determine the base size by performing layout
				var childWidthMeasureSpec, childHeightMeasureSpec;
				var align = getAlign(child);

				if (isStyleDimDefined(child, DIRECTION_ROW)) {
					childWidthMeasureSpec = measureSpec.make(child.style.width, measureSpec.EXACTLY);
				} else if (crossAxis === DIRECTION_ROW && widthMode === measureSpec.EXACTLY && align === ALIGN_STRETCH) {
					childWidthMeasureSpec = measureSpec.make(widthSize, measureSpec.EXACTLY);
				} else {
					var mode = widthSize ? measureSpec.AT_MOST : measureSpec.UNSPECIFIED;
					childWidthMeasureSpec = measureSpec.make(widthSize, mode);
				}

				if (isStyleDimDefined(child, DIRECTION_COLUMN)) {
					childHeightMeasureSpec = measureSpec.make(child.style.height, measureSpec.EXACTLY);
				} else if (crossAxis === DIRECTION_COLUMN && heightMode === measureSpec.EXACTLY && align === ALIGN_STRETCH) {
					childHeightMeasureSpec = measureSpec.make(heightSize, measureSpec.EXACTLY);
				} else {
					var mode = heightSize ? measureSpec.AT_MOST : measureSpec.UNSPECIFIED;
					childHeightMeasureSpec = measureSpec.make(heightSize, mode);
				}

				// Measure the child
				child.layout(childWidthMeasureSpec, childHeightMeasureSpec);
				child.basis = getLayoutSize(child, mainAxis);
			}

			sizeConsumed += child.basis + getMargin(child, mainAxis);

			if (isFlex(child)) {
				totalFlexGrowFactors += getFlexGrowFactor(child);
				totalFlexShrinkScaledFactors += getFlexShrinkFactor(child) * child.basis;
			}
		}

		var leadingMainSize = 0, betweenMain = 0;

		// Layout flexible children and allocate empty space
		var remainingSpace = availableMain ? availableMain - sizeConsumed : 0; // The remaining available space in the main axis
		for (var i = 0, length = this.children.length; i < length; ++i) {
			var child = this.children[i];
			var childBasis = child.basis;
			var childMainSize = childBasis;

			if (remainingSpace < 0) {
				var flexShrinkScaledFactor = getFlexShrinkFactor(child) * childBasis;
				if (flexShrinkScaledFactor !== 0) childMainSize = childBasis + remainingSpace / totalFlexShrinkScaledFactors * flexShrinkScaledFactor;
			} else if (remainingSpace > 0) {
				var flexGrowFactor = getFlexGrowFactor(child);
				if (flexGrowFactor !== 0) childMainSize = childBasis + remainingSpace / totalFlexGrowFactors * flexGrowFactor;
			}

			var childWidthMeasureSpec, childHeightMeasureSpec;
			if (mainAxis === DIRECTION_ROW) {
				childWidthMeasureSpec = measureSpec.make(childMainSize, measureSpec.EXACTLY);

				if (isStyleDimDefined(child, DIRECTION_COLUMN)) {
					childHeightMeasureSpec = measureSpec.make(child.style.height, measureSpec.EXACTLY);
				} else if (heightSize && heightMode === measureSpec.EXACTLY && getAlign(child) === ALIGN_STRETCH) {
					childHeightMeasureSpec = measureSpec.make(heightSize, measureSpec.EXACTLY);
				} else {
					var mode = heightSize ? measureSpec.AT_MOST : measureSpec.UNSPECIFIED;
					childHeightMeasureSpec = measureSpec.make(heightSize, mode);
				}
			} else {
				childHeightMeasureSpec = measureSpec.make(childMainSize, measureSpec.EXACTLY);

				if (isStyleDimDefined(child, DIRECTION_ROW)) {
					childWidthMeasureSpec = measureSpec.make(child.style.width, measureSpec.EXACTLY);
				} else if (widthSize && widthMode === measureSpec.EXACTLY && getAlign(child) === ALIGN_STRETCH) {
					childWidthMeasureSpec = measureSpec.make(widthSize, measureSpec.EXACTLY);
				} else {
					var mode = widthSize ? measureSpec.AT_MOST : measureSpec.UNSPECIFIED;
					childWidthMeasureSpec = measureSpec.make(widthSize, mode);
				}
			}
			child.layout(childWidthMeasureSpec, childHeightMeasureSpec);
		}
		if (totalFlexGrowFactors === 0 && remainingSpace > 0 && measureSpec.getMode(mainMeasureSpec) === measureSpec.EXACTLY) {
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
					if (this.children.length > 1) betweenMain = remainingSpace / (this.children.length - 1);
					break;
				case ALIGN_SPACE_AROUND:
					betweenMain = remainingSpace / this.children.length;
					leadingMainSize = betweenMain / 2;
					break;
				default:
					throw new Error("Invalid value for justifyContent.");
			}
		}

		var mainSize = leadingMainSize, crossSize = 0;

		// Position elements in the main axis
		for (var i = 0, length = this.children.length; i < length; i++) {
			var child = this.children[i];
			child[pos[mainAxis]] = mainSize + getLeadingMargin(child, mainAxis);
			mainSize += betweenMain + getDimWithMargin(child, mainAxis);
			crossSize = Math.max(crossSize, getDimWithMargin(child, crossAxis));
		}

		// If the dimensions are definite: use them
		if (measureSpec.getMode(mainMeasureSpec) === measureSpec.EXACTLY) mainSize = measureSpec.getSize(mainMeasureSpec);
		if (measureSpec.getMode(crossMeasureSpec) === measureSpec.EXACTLY) crossSize = measureSpec.getSize(crossMeasureSpec);

		// Position elements in the cross axis
		for (var i = 0, length = this.children.length; i < length; i++) {
			var child = this.children[i];
			var leadingCrossDim = 0;
			var align = getAlign(child);
			if (align === ALIGN_STRETCH) {
				var childWidth = child.width, childHeight = child.height;
				var isCrossSizeDefinite = false;
				if (mainAxis === DIRECTION_ROW) {
					isCrossSizeDefinite = isStyleDimDefined(child, DIRECTION_COLUMN);
					childHeight = crossSize - getMargin(child, DIRECTION_COLUMN);
				} else {
					isCrossSizeDefinite = isStyleDimDefined(child, DIRECTION_ROW);
					childWidth = crossSize - getMargin(child, DIRECTION_ROW);
				}
				// If the cross size of the child wasn't already definite
				if (!isCrossSizeDefinite) {
					var childWidthMeasureSpec = measureSpec.make(childWidth, childWidth ? measureSpec.EXACTLY : measureSpec.UNSPECIFIED);
					var childHeightMeasureSpec = measureSpec.make(childHeight, childHeight ? measureSpec.EXACTLY : measureSpec.UNSPECIFIED);
					child.layout(childWidthMeasureSpec, childHeightMeasureSpec);
				}
			} else if (align !== ALIGN_FLEX_START) {
				var remainingCrossDim = crossSize - getDimWithMargin(child, crossAxis);

				if (align === ALIGN_CENTER) leadingCrossDim += remainingCrossDim / 2;
				else if (align === ALIGN_FLEX_END) leadingCrossDim += remainingCrossDim;
				else throw new Error("Invalid align value.");
			}
			child[pos[crossAxis]] = leadingCrossDim + getLeadingMargin(child, crossAxis);
		}

		// Set the implicit width and height
		var measuredWidth = mainAxis === DIRECTION_ROW ? mainSize : crossSize;
		var measuredHeight = mainAxis === DIRECTION_ROW ? crossSize : mainSize;
		this.setDimension(measuredWidth, measuredHeight);
	}
}

Panel.DIRECTION_ROW = DIRECTION_ROW;
Panel.DIRECTION_COLUMN = DIRECTION_COLUMN;
Panel.ALIGN_STRETCH = ALIGN_STRETCH;
Panel.ALIGN_FLEX_START = ALIGN_FLEX_START;
Panel.ALIGN_CENTER = ALIGN_CENTER;
Panel.ALIGN_FLEX_END = ALIGN_FLEX_END;
Panel.ALIGN_SPACE_BETWEEN = ALIGN_SPACE_BETWEEN;
Panel.ALIGN_SPACE_AROUND = ALIGN_SPACE_AROUND;
