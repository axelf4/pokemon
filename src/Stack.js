import WidgetGroup from "WidgetGroup";
import * as measureSpec from "./measureSpec";
import {Mode} from "./measureSpec";

export default class Stack extends WidgetGroup {
	layout(widthMeasureSpec, heightMeasureSpec) {
		let widthMode = measureSpec.getMode(widthMeasureSpec),
			heightMode = measureSpec.getMode(heightMeasureSpec),
			widthSize = measureSpec.getSize(widthMeasureSpec),
			heightSize = measureSpec.getSize(heightMeasureSpec);

		let width = 0, height = 0;

		for (let child of this.children) {
			let marginRow = child.marginLeft + child.marginRight,
				marginColumn = child.marginTop + child.marginBottom;

			let childWidthMeasureSpec, childHeightMeasureSpec;
			childWidthMeasureSpec = measureSpec.adjust(widthMeasureSpec, -marginRow);
			childHeightMeasureSpec = measureSpec.adjust(heightMeasureSpec, -marginColumn);
			child.layout(childWidthMeasureSpec, childHeightMeasureSpec);
			child.setPosition(child.marginLeft, child.marginTop);

			width = Math.max(width, child.width + marginRow);
			height = Math.max(height, child.height + marginColumn);
		}

		this.setDimension(width, height);
	}
}
