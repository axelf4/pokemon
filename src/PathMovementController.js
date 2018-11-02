import * as direction from "direction";

export default class PathMovementController {
	constructor(path, callback) {
		this.path = path;
		this.callback = callback;
	}

	/**
	 * @warning If you try to walk into something solid you could get stuck indefinitely.
	 */
	getTarget(game, dt, position, entity) {
		if (this.path.length === 0) {
			this.callback();
			return direction.NO_DIRECTION;
		}

		// Check for collisions
		const dir = this.path[0];
		const dx = direction.getDeltaX(dir), dy = direction.getDeltaY(dir);
		if (game.isSolid(position.x + dx, position.y + dy)) {
			return direction.NO_DIRECTION;
		}

		return this.path.shift();
	}
}
