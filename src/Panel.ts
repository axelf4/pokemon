/** @file Container with flexbox inspired layout. */

import type Widget from "./Widget";
import WidgetGroup from "./WidgetGroup";
import * as measureSpec from "./measureSpec";
import {MeasureSpec, Mode} from "./measureSpec";

export enum Direction {
	Row, Column
}

function getPerpendicularAxis(axis: Direction): Direction {
	return axis === Direction.Row ? Direction.Column : Direction.Row;
}

export enum Align {
	FlexStart,
	FlexEnd,
	Center,
	SpaceBetween,
	SpaceAround,
	Stretch,
}

// Widget measurements indexed by Direction.Row/Column
const pos = ["x", "y"] as const,
	dim = ["width", "height"] as const;

function getLayoutSize(node: Widget, axis: Direction): number {
	return node[dim[axis]];
}

function getStyleSize(node: Widget, axis: Direction): number | undefined {
	return node.style[dim[axis]];
}

function getLeadingMargin(node: Widget, axis: Direction): number {
	return axis === Direction.Row ? node.marginLeft : node.marginTop;
}

function getTrailingMargin(node: Widget, axis: Direction): number {
	return axis === Direction.Row ? node.marginRight : node.marginBottom;
}

function getMargin(node: Widget, axis: Direction): number {
	return getLeadingMargin(node, axis) + getTrailingMargin(node, axis);
}

function getDimWithMargin(node: Widget, axis: Direction): number {
	return getLayoutSize(node, axis) + getMargin(node, axis);
}

function getAlign(node: Widget): Align {
	return node.style.align ?? Align.FlexStart; // TODO get rid of style property
}

function isFlex(node: Widget): boolean {
	return (node as any).flex > 0;
}

function getFlex(node: Widget): number {
	return (node as any).flex || 0;
}

function isFlexBasisAuto(node: Widget): boolean {
	return getFlex(node) <= 0;
}

function getFlexGrowFactor(node: Widget): number {
	let flex = getFlex(node);
	return flex > 0 ? flex : 0;
}

function getFlexShrinkFactor(node: Widget): number {
	return getFlex(node) < 0 ? 1 : 0;
}

export default class Panel extends WidgetGroup {
	constructor(
		private readonly direction = Direction.Row,
		private readonly justify = Align.FlexStart,
	) {
		super();
	}

	layout(widthMeasureSpec: MeasureSpec, heightMeasureSpec: MeasureSpec) {
		let widthMode = measureSpec.getMode(widthMeasureSpec),
			heightMode = measureSpec.getMode(heightMeasureSpec),
			width = measureSpec.getSize(widthMeasureSpec),
			height = measureSpec.getSize(heightMeasureSpec);
		let mainAxis = this.direction, crossAxis = getPerpendicularAxis(mainAxis);

		let mainMeasureSpec = mainAxis === Direction.Row ? widthMeasureSpec : heightMeasureSpec,
			crossMeasureSpec = crossAxis === Direction.Row ? widthMeasureSpec : heightMeasureSpec;
		let availableMain = measureSpec.getSize(mainMeasureSpec),
			availableCross = measureSpec.getSize(crossMeasureSpec),
			mainMode = measureSpec.getMode(mainMeasureSpec),
			crossMode = measureSpec.getMode(crossMeasureSpec);

		// Determine basis for each child
		let sizeConsumed = 0, // Dimensions of the content in the main axis
			totalFlexGrowFactors = 0,
			totalFlexShrinkScaledFactors = 0;
		for (let child of this.children) {
			let styleSize = getStyleSize(child, mainAxis), basis;
			if (styleSize !== undefined) {
				basis = styleSize;
			} else if (!isFlexBasisAuto(child) && availableMain) {
				basis = 0;
			} else {
				// Determine the base size by performing layout
				let childWidthMeasureSpec, childHeightMeasureSpec;
				let align = getAlign(child);

				if (getStyleSize(child, Direction.Row) !== undefined) {
					childWidthMeasureSpec = measureSpec.make(child.style.width, Mode.Exactly);
				} else if (crossAxis === Direction.Row && widthMode === Mode.Exactly && align === Align.Stretch) {
					childWidthMeasureSpec = measureSpec.make(width, Mode.Exactly);
				} else {
					childWidthMeasureSpec = measureSpec.make(
						width,
						widthMode === Mode.Unspecified ? Mode.Unspecified : Mode.AtMost
					);
				}

				if (getStyleSize(child, Direction.Column) !== undefined) {
					childHeightMeasureSpec = measureSpec.make(child.style.height, Mode.Exactly);
				} else if (crossAxis === Direction.Column && heightMode === Mode.Exactly && align === Align.Stretch) {
					childHeightMeasureSpec = measureSpec.make(height, Mode.Exactly);
				} else {
					childHeightMeasureSpec = measureSpec.make(
						height,
						heightMode === Mode.Unspecified ? Mode.Unspecified : Mode.AtMost
					);
				}

				// Measure the child
				child.layout(childWidthMeasureSpec, childHeightMeasureSpec);
				basis = getLayoutSize(child, mainAxis);
			}

			child.width = basis; // Store the basis in the width of the child
			sizeConsumed += basis + getMargin(child, mainAxis);
			totalFlexGrowFactors += getFlexGrowFactor(child);
			totalFlexShrinkScaledFactors += getFlexShrinkFactor(child) * basis;
		}

		let remainingSpace = availableMain ? availableMain - sizeConsumed : 0; // The remaining available space in the main axis
		let leadingMainSize = 0, betweenMain = 0;
		if (totalFlexGrowFactors === 0 && remainingSpace > 0 && mainMode === Mode.Exactly) {
			// Allocate remaining space according to justify
			switch (this.justify) {
				case Align.FlexStart: case Align.Stretch: break;
				case Align.Center:
					leadingMainSize = remainingSpace / 2;
					break;
				case Align.FlexEnd:
					leadingMainSize = remainingSpace;
					break;
				case Align.SpaceBetween:
					if (this.children.length > 1) betweenMain = remainingSpace / (this.children.length - 1);
					break;
				case Align.SpaceAround:
					betweenMain = remainingSpace / this.children.length;
					leadingMainSize = betweenMain / 2;
					break;
			}
		}

		// Layout flexible children and allocate empty space
		let mainSize = leadingMainSize, crossSize = 0;
		for (let child of this.children) {
			let childBasis = child.width;

			if (remainingSpace < 0) {
				let flexShrinkScaledFactor = getFlexShrinkFactor(child) * childBasis;
				if (flexShrinkScaledFactor)
					childBasis += flexShrinkScaledFactor * remainingSpace / totalFlexShrinkScaledFactors;
			} else {
				let flexGrowFactor = getFlexGrowFactor(child);
				if (flexGrowFactor)
					childBasis += flexGrowFactor * remainingSpace / totalFlexGrowFactors;
			}

			let childCrossSize = getStyleSize(child, crossAxis)
				?? availableCross - getMargin(child, crossAxis);
			let childCrossMode = getStyleSize(child, crossAxis) !== undefined
				|| (crossMode === Mode.Exactly && getAlign(child) === Align.Stretch)
				? Mode.Exactly
				: (crossMode === Mode.Unspecified ? Mode.Unspecified : Mode.AtMost);
			if (mainAxis === Direction.Row)
				child.layout(measureSpec.make(childBasis, Mode.Exactly),
							 measureSpec.make(childCrossSize, childCrossMode));
			else
				child.layout(measureSpec.make(childCrossSize, childCrossMode),
							 measureSpec.make(childBasis, Mode.Exactly));

			// Position elements in the main axis
			child[pos[mainAxis]] = mainSize + getLeadingMargin(child, mainAxis);
			mainSize += betweenMain + getDimWithMargin(child, mainAxis);
			crossSize = Math.max(crossSize, getDimWithMargin(child, crossAxis));
		}

		// If the dimensions are definite: use them
		if (mainMode === Mode.Exactly) mainSize = availableMain;
		if (crossMode === Mode.Exactly) crossSize = availableCross;

		// Position elements in the cross axis
		for (let child of this.children) {
			let leadingCrossDim = 0;
			switch (getAlign(child)) {
				case Align.FlexStart: case Align.Stretch: break;
				case Align.Stretch:
					// Layout the child if the cross size was not already definite
					if (getStyleSize(child, crossAxis) === undefined) {
						let childCrossSize = crossSize - getMargin(child, crossAxis);
						let childWidth = crossAxis === Direction.Row ? childCrossSize : child.width,
						childHeight = crossAxis === Direction.Column ? childCrossSize : child.height;
						child.layout(measureSpec.make(childWidth, Mode.Exactly),
									 measureSpec.make(childHeight, Mode.Exactly));
					}
					break;
				case Align.Center:
				case Align.FlexEnd:
					leadingCrossDim = (crossSize - getDimWithMargin(child, crossAxis))
						/ (getAlign(child) == Align.Center ? 2 : 1);
					break;
			}
			child[pos[crossAxis]] = leadingCrossDim + getLeadingMargin(child, crossAxis);
		}

		// Set the implicit width and height
		let measuredWidth = mainAxis === Direction.Row ? mainSize : crossSize;
		let measuredHeight = mainAxis === Direction.Row ? crossSize : mainSize;
		this.setDimension(measuredWidth, measuredHeight);
	}
}
