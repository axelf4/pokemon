var direction = require("direction");

var AnimationComponent = function(animations) {
	this.animations = animations;
};

AnimationComponent.prototype.getAnimation = function(dir) {
	switch (dir) {
		case direction.LEFT: return this.animations.left;
		case direction.RIGHT: return this.animations.right;
		case direction.UP: return this.animations.up;
		case direction.DOWN: return this.animations.down;
		default: throw new Error("Invalid direction.");
	}
};

module.exports = AnimationComponent;
