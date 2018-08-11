var Widget = require("Widget");
var measureSpec = require("measureSpec");
var renderer = require("renderer");

export default class State {
	constructor() {
		this.widget = null;
		this.width = -1;
		this.height = -1;
	}

	update(dt, time) {}

	draw(batch, dt, time) {
		if (this.widget && this.widget.flags & Widget.FLAG_LAYOUT_REQUIRED) {
			var widthMeasureSpec = measureSpec.make(this.width, measureSpec.EXACTLY);
			var heightMeasureSpec = measureSpec.make(this.height, measureSpec.EXACTLY);

			this.widget.layout(widthMeasureSpec, heightMeasureSpec);
		}

		batch.begin();
		this.widget.draw(batch, dt, time);
		batch.end();
	}

	resize(width, height) {
		this.width = width;
		this.height = height;

		if (this.widget) {
			var widthMeasureSpec = measureSpec.make(width, measureSpec.EXACTLY);
			var heightMeasureSpec = measureSpec.make(height, measureSpec.EXACTLY);

			this.widget.layout(widthMeasureSpec, heightMeasureSpec);
		}
	}

	onKey(type, key) {
		if (this.widget) {
			this.widget.onKey(type, key);
		}
	}
}
