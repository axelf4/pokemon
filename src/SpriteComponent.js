import Direction from "direction";

export default class SpriteComponent {
	constructor(self, texRegion, animations) {
		this.texRegion = texRegion;
		this.animations = animations;
		this.offsetX = 0;
		this.offsetY = 0;
	}

	getAnimation(dir) {
		switch (dir) {
			case Direction.Left: return this.animations.left;
			case Direction.Right: return this.animations.right;
			case Direction.Up: return this.animations.up;
			case Direction.Down: return this.animations.down;
			default: throw new Error("Invalid direction");
		}
	}
}
