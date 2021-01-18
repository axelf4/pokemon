var Animation = function(frameDuration, frames) {
	this.frameDuration = frameDuration;
	this.frames = frames;
	this.timer = 0;
};

Animation.prototype.getFrame = function(time) {
	return this.frames[time / this.frameDuration % this.frames.length | 0];
};

module.exports = Animation;
