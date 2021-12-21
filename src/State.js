import Widget from "./Widget";
var measureSpec = require("measureSpec");
var renderer = require("renderer");

const gl = renderer.gl;

export default class State {
	constructor() {
		this.widget = null;
		this.width = -1;
		this.height = -1;
	}

	update(dt, time) {}

	draw(batch, dt, time) {
		if (this.widget && this.widget.isLayoutRequired()) {
			let widthMeasureSpec = measureSpec.make(this.width, measureSpec.EXACTLY),
				heightMeasureSpec = measureSpec.make(this.height, measureSpec.EXACTLY);
			this.widget.layout(widthMeasureSpec, heightMeasureSpec);
		}

		gl.clearColor(1.0, 1.0, 1.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);

		batch.begin();
		this.widget?.draw(batch, dt, time);
		batch.end();
	}

	resize(width, height) {
		this.width = width;
		this.height = height;

		this.widget?.invalidate();
	}

	onKey(type, key) {
		this.widget?.onKey(type, key);
	}
}
