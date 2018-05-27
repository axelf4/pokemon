var Widget = require("Widget.js");
var measureSpec = require("measureSpec.js");
var lerp = require("lerp");
const TWEEN = require("@tweenjs/tween.js");

const Healthbar = function(loader) {
	Widget.call(this);
	this.percentage = 1;

	loader.loadTexture("assets/hpbar.png").then(texRegion => {
		this.texRegion = texRegion;
	});
};
Healthbar.prototype = Object.create(Widget.prototype);
Healthbar.prototype.constructor = Healthbar;

Healthbar.prototype.layout = function(widthMeasureSpec, heightMeasureSpec) {
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
};

Healthbar.prototype.setPercentage = function(percentage) {
	console.log(percentage);
	return new Promise((resolve, reject) => {
		let test = { p: this.percentage };
		new TWEEN.Tween(test) // Create a new tween
			.to({ p: percentage }, 1000) // Move to percentage in 1 second.
			.easing(TWEEN.Easing.Quadratic.Out) // Use an easing function to make the animation smooth.
			.onUpdate(() => {
				console.log(test);
				this.percentage = test.p;
			})
			.onComplete(resolve).onStop(reject)
			.start();
	});
};

Healthbar.prototype.draw = function(batch, dt, time) {
	const texRegion = this.texRegion;
	const texture = texRegion.texture;

	const u0 = texRegion.x0 / texRegion.width;
	const uFirstEnd = (texRegion.x0 + 19 + 0.5) / texRegion.width;
	const uLastEnd = (texRegion.x0 + 20 - 0.5) / texRegion.width;
	const u1 = texRegion.x1 / texRegion.width;
	const v0 = texRegion.y0 / texRegion.height;
	const v1 = texRegion.y1 / texRegion.height;

	// Draw first end
	batch.draw(texture, this.x, this.y, this.x + 16, this.y + 7, u0, v0, (texRegion.x0 + 16 + 0.5) / texRegion.width, v1);
	// Draw black bar background
	batch.draw(texture, this.x + 16, this.y, this.x + this.width - 2, this.y + 7, uFirstEnd, v0, uLastEnd, v1);
	// Draw green/yellow/red
	// const p = Math.sin(time / 1000) / 2 + 0.5;
	const p = this.percentage;
	const colorOffset = p > 0.5 ? 16 : p > 0.2 ? 17 : 18;
	const end = this.x + lerp(16, this.width - 2, p);
	batch.draw(texture, this.x + 16, this.y, end, this.y + 7,
			(texRegion.x0 + colorOffset + 0.5) / texRegion.width, v0,
			(texRegion.x0 + colorOffset + 1 - 0.5) / texRegion.width, v1);
	// Draw last end
	batch.draw(texture, this.x + this.width - 2, this.y, this.x + this.width, this.y + 7, uLastEnd, v0, u1, v1);
};

module.exports = Healthbar;
