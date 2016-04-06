var Region = require("Region.js");

var Animation = function(frameDuration, frames) {
	this.frameDuration = frameDuration;
	this.frames = frames;
	this.timer = 0;
};
Animation.prototype.getKeyFrame = function(time) {
	var frameNumber = Math.floor(time / this.frameDuration);
	return this.frames[frameNumber % this.frames.length];
};
Animation.prototype.getFrame = Animation.prototype.getKeyFrame;

Animation.getSheetFromTexture = function(count, x, y, width, height, row, spacing) {
	row = row || count; // number of frames on each row
	spacing = spacing || 0;
	var frames = new Array(count);
	for (var i = 0; i < count; i++) {
		frames[i] = new Region(
				x + (width + spacing) * (i % row),
				y + (height + spacing) * Math.floor(i / row),
				width, height);
	}
	return frames;
};

module.exports = Animation;
