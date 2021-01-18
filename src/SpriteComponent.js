import {LEFT, RIGHT, UP, DOWN} from "direction";

export default class SpriteComponent {
	constructor(self, texRegion, animations) {
		this.texRegion = texRegion;
		this.animations = animations;
		this.offsetX = 0;
		this.offsetY = 0;
	}

	getAnimation(dir) {
		switch (dir) {
			case LEFT: return this.animations.left;
			case RIGHT: return this.animations.right;
			case UP: return this.animations.up;
			case DOWN: return this.animations.down;
			default: throw new Error("Invalid direction");
		}
	}
}
