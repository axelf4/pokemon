var Widget = require("Widget.js");
var measureSpec = require("measureSpec.js");
var lerp = require("lerp");
import TWEEN from "@tweenjs/tween.js";

export default class Healthbar extends Widget {
	constructor(loader, percentage = 1) {
		super();
		this.percentage = percentage;

		loader.load("assets/sprites/hpbar.png").then(texRegion => {
			this.texRegion = texRegion;
		});
	}

	layout(widthMeasureSpec, heightMeasureSpec) {
		var widthMode = measureSpec.getMode(widthMeasureSpec);
		var heightMode = measureSpec.getMode(heightMeasureSpec);
		var widthSize = measureSpec.getSize(widthMeasureSpec);
		var heightSize = measureSpec.getSize(heightMeasureSpec);

		let width;
		switch (widthMode) {
			case measureSpec.UNSPECIFIED: width = 22; break;
			case measureSpec.EXACTLY: width = widthSize; break;
			case measureSpec.AT_MOST: width = Math.min(widthSize, 22); break;
		}

		this.setDimension(width, 7);
	}

	setPercentage(percentage, animate = true) {
		return new Promise((resolve, reject) => {
			new TWEEN.Tween({ p: this.percentage }) // Create a new tween
				.to({ p: percentage }, animate ? 1000 : 0) // Move to percentage in 1 second.
				.easing(TWEEN.Easing.Quadratic.Out) // Use an easing function to make the animation smooth.
				.onUpdate(object => {
					this.percentage = object.p;
				})
				.onComplete(resolve).onStop(reject)
				.start();
		});
	}

	draw(batch, dt, time) {
		const {texture: {texture, width: texWidth, height: texHeight}, u1, v1, u2, v2}
			  = this.texRegion;

		const uFirstEnd = u1 + (19 + 0.5) / texWidth,
			  uLastEnd = u1 + (20 - 0.5) / texWidth;

		// Draw first end
		batch.draw(texture, this.x, this.y, this.x + 16, this.y + 7, u1, v1, u1 + (16 + 0.5) / texWidth, v2);
		// Draw black bar background
		batch.draw(texture, this.x + 16, this.y, this.x + this.width - 2, this.y + 7, uFirstEnd, v1, uLastEnd, v2);
		// Draw green/yellow/red
		const p = this.percentage;
		const colorOffset = p > 0.5 ? 16 : p > 0.2 ? 17 : 18;
		const end = this.x + lerp(16, this.width - 2, p);
		batch.draw(texture, this.x + 16, this.y, end, this.y + 7,
			u1 + (colorOffset + 0.5) / texWidth, v1,
			u1 + (colorOffset + 1 - 0.5) / texWidth, v2);
		// Draw last end
		batch.draw(texture, this.x + this.width - 2, this.y, this.x + this.width, this.y + 7, uLastEnd, v1, u2, v2);
	}
}
