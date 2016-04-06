var flex = function() {
	var dim = {
		'row': 'width',
		'row-reverse': 'width',
		'column': 'height',
		'column-reverse': 'height'
	};
	var pos = {
		'row': 'left',
		'row-reverse': 'right',
		'column': 'top',
		'column-reverse': 'bottom'
	};
	var DIRECTION_ROW = "row";
	var DIRECTION_ROW_REVERSE = "row-reverse";
	var DIRECTION_COLUMN = "column";
	var DIRECTION_COLUMN_REVERSE = "column-reverse";
	var ALIGN_STRETCH = "stretch";
	var ALIGN_FLEX_START = "flex-start";
	var ALIGN_CENTER = "center";
	var ALIGN_FLEX_END = "flex-end";

	var FlexLayout = function() {};
	var getLeadingMargin = function(item, axis) {
		var value;
		switch (axis) {
			case DIRECTION_ROW: value = item.style.marginLeft; break;
			case DIRECTION_ROW_REVERSE: value = item.style.marginRigth; break;
			case DIRECTION_COLUMN: value = item.style.marginTop; break;
			case DIRECTION_COLUMN_REVERSE: value = item.style.marginBottom; break;
		}
		return value || 0;
	};
	var getTrailingMargin = function(item, axis) {
		var value;
		switch (axis) {
			case DIRECTION_ROW: value = item.style.marginRigth; break;
			case DIRECTION_ROW_REVERSE: value = item.style.marginLeft; break;
			case DIRECTION_COLUMN: value = item.style.marginBottom; break;
			case DIRECTION_COLUMN_REVERSE: value = item.style.marginLeft; break;
		}
		return value || 0;
	};
	var getMargin = function(item, axis) {
		return getLeadingMargin(item, axis) + getTrailingMargin(item, axis);
	};
	var isFlex = function(item) {
		return item.style.flex > 0;
	};
	var getPerpendicularAxis = function(axis) {
		if (axis == DIRECTION_ROW) return DIRECTION_COLUMN;
		if (axis == DIRECTION_ROW_REVERSE) return DIRECTION_COLUMN_REVERSE;
		if (axis == DIRECTION_COLUMN) return DIRECTION_ROW;
		if (axis == DIRECTION_COLUMN_REVERSE) return DIRECTION_ROW_REVERSE;
	};
	var isRowAxis = function(axis) {
		return axis === DIRECTION_ROW || axis === DIRECTION_ROW_REVERSE;
	};
	var isColumnAxis = function(axis) {
		return axis === DIRECTION_COLUMN || axis === DIRECTION_COLUMN_REVERSE;
	};
	function isStyleDimDefined(node, axis) {
		return node.style[dim[axis]] !== undefined && node.style[dim[axis]] >= 0;
	}
	var getLayoutSize = function(item, axis) {
		return item[dim[axis]];
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
	var getAlignItem = function(node, child) {
		if (child.style.align) return child.style.align;
		return ALIGN_FLEX_START;
	};

	// direction: row | row-reverse | column | column-reverse, initial = row
	// flex: <positive-number>, initial = 0
	// align, initial = flex-start property and align-content for whole
	// flex-start flex-end center stretch
	// no reordering with order
	// overflow is undefined behavior
	FlexLayout.prototype.layout = function(container) {
		var mainAxis = container.style.direction, crossAxis = getPerpendicularAxis(mainAxis);
		setDimensionFromStyle(container, mainAxis);
		setDimensionFromStyle(container, crossAxis);

		var definedMainSize = getLayoutSize(container, mainAxis);
		var definedCrossSize = getLayoutSize(container, crossAxis);
		var maxWidth = getLayoutSize(container, DIRECTION_ROW);
		var maxHeight = getLayoutSize(container, DIRECTION_COLUMN);

		var mainContentDim = 0; // Dimensions of the content in the main axis
		var flexibleChildren = [];
		var totalFlex = 0;
		for (var i = 0, length = container.children.length; i < length; i++) {
			var item = container.children[i];
			var nextContentDim = 0;

			var align = item.style.align || ALIGN_STRETCH;
			if (align === ALIGN_STRETCH && definedCrossSize) {
				item[dim[crossAxis]] = Math.max(definedCrossSize - getMargin(item, crossAxis), 0);
			}

			if (definedMainSize && isFlex(item)) {
				flexibleChildren.push(item);
				totalFlex += item.style.flex;
				// nextContentDim = getMargin(item, mainAxis);
			} else {
				// Determine the base size by performing layout
				item.manager.layout(item, maxWidth, maxHeight);
				nextContentDim = getDimWithMargin(item, mainAxis);
			}
			mainContentDim += nextContentDim;
		}

		// Layout flexible children and allocate empty space
		var justifyContent = container.style.justifyContent || ALIGN_FLEX_START;
		var leadingMainSize = 0;
		var remaining = definedMainSize - mainContentDim;
		if (flexibleChildren.length !== 0) {
			var flexibleMainDim = remaining / totalFlex;
			if (flexibleMainDim < 0) flexibleMainDim = 0;
			for (var i = 0, length = flexibleChildren.length; i < length; i++) {
				var item = flexibleChildren[i];
				item[dim[mainAxis]] = flexibleMainDim * item.style.flex;
				item.manager.layout(item, maxWidth, maxHeight);
			}
			// Allocate remaining space according to justifyContent.
		} else if (justifyContent === ALIGN_CENTER) leadingMainSize = remaining / 2;
		else if (justifyContent === ALIGN_FLEX_END) leadingMainSize = remaining;

		// Position elements in the main axis
		var mainSize = leadingMainSize;
		var crossSize = 0;
		for (var i = 0, length = container.children.length; i < length; i++) {
			var item = container.children[i];
			item[pos[mainAxis]] = mainSize + getLeadingMargin(item, mainAxis);
			mainSize += getDimWithMargin(item, mainAxis);
			crossSize = Math.max(crossSize, getDimWithMargin(item, crossAxis));
		}
		// Position elements in the cross axis
		for (var i = 0, length = container.children.length; i < length; i++) {
			var item = container.children[i];
			var leadingCrossDim = 0;
			var align = getAlignItem(container, item);
			if (align === ALIGN_STRETCH) item[dim[crossAxis]] = crossSize - getMargin(item, crossAxis);
			else if (align !== ALIGN_FLEX_START) {
				var remainingCrossDim = crossSize - getDimWithMargin(item, crossAxis);
				if (align === ALIGN_CENTER) leadingCrossDim += remainingCrossDim / 2;
				else leadingCrossDim += remainingCrossDim; // ALIGN_FLEX_END
			}
			item[pos[crossAxis]] = leadingCrossDim + getLeadingMargin(item, crossAxis);
		}

		// If the user didn't specify a width or height, and it has not been set
		// by the container, then we set it via the children.
		// Set the implicit width and height if not specified
		if (!definedMainSize) container[dim[mainAxis]] = mainSize;
		if (!definedCrossSize) container[dim[crossAxis]] = crossSize;
	};
	return {
		FlexLayout: FlexLayout,
		DIRECTION_ROW: DIRECTION_ROW,
		DIRECTION_ROW_REVERSE: DIRECTION_ROW_REVERSE,
		DIRECTION_COLUMN: DIRECTION_COLUMN,
		DIRECTION_COLUMN_REVERSE: DIRECTION_COLUMN_REVERSE,
		ALIGN_STRETCH: ALIGN_STRETCH,
		ALIGN_FLEX_START: ALIGN_FLEX_START,
		ALIGN_CENTER: ALIGN_CENTER,
		ALIGN_FLEX_END: ALIGN_FLEX_END,
	};
}();
