var Widget = require("Widget.js");
import WidgetGroup from "WidgetGroup";
var measureSpec = require("measureSpec.js");

export default class Stack extends WidgetGroup {
	constructor() {
		super();
	}

	layout(widthMeasureSpec, heightMeasureSpec) {
		var widthMode = measureSpec.getMode(widthMeasureSpec);
		var heightMode = measureSpec.getMode(heightMeasureSpec);
		var widthSize = measureSpec.getSize(widthMeasureSpec);
		var heightSize = measureSpec.getSize(heightMeasureSpec);

		var width = 0, height = 0;

		for (var i = 0, length = this.children.length; i < length; ++i) {
			var child = this.children[i];

			var marginRow = child.marginLeft + child.marginRight;
			var marginColumn = child.marginTop + child.marginBottom;

			var childWidthMeasureSpec, childHeightMeasureSpec;
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
