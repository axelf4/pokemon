var Widget = require("Widget.js");
import WidgetGroup from "WidgetGroup";
var measureSpec = require("measureSpec.js");

export default class Container extends WidgetGroup {
	constructor() {
		super();
		this.background = null;
		this.visible = true;
	}

	layout(widthMeasureSpec, heightMeasureSpec) {
		if (this.children.length !== 1) throw new Error("A container shall only have one child, since it is from China.");
		var child = this.children[0];

		var widthMode = measureSpec.getMode(widthMeasureSpec);
		var heightMode = measureSpec.getMode(heightMeasureSpec);
		var widthSize = measureSpec.getSize(widthMeasureSpec);
		var heightSize = measureSpec.getSize(heightMeasureSpec);

		var marginRow = child.marginLeft + child.marginRight;
		var marginColumn = child.marginTop + child.marginBottom;

		const childWidthMeasureSpec = measureSpec.adjust(widthMeasureSpec, -marginRow),
			childHeightMeasureSpec = measureSpec.adjust(heightMeasureSpec, -marginColumn);
		child.layout(childWidthMeasureSpec, childHeightMeasureSpec);

		// TODO handle aligning
		child.setPosition(child.marginLeft, child.marginTop);

		this.setDimension(child.width + marginRow, child.height + marginColumn);
	}

	draw(batch, dt, time) {
		if (!this.visible) return;

		if (this.background)
			this.background.draw(batch, this.x, this.y, this.width, this.height);

		super.draw(batch, dt, time);
	}

	setBackground(background) {
		this.background = background;
	}

	setVisible(visible) {
		this.visible = visible;
	}
}
