import {LEFT, RIGHT, UP, DOWN} from "direction";

export default class Animatable {
	constructor(self, animations) {
		this.animations = animations;
	}

	getAnimation(dir) {
		switch (dir) {
			case LEFT: return this.animations.left;
			case RIGHT: return this.animations.right;
			case UP: return this.animations.up;
			case DOWN: return this.animations.down;
			default: throw new Error("Invalid direction.");
		}
	}
}
