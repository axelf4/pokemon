import * as direction from "direction";
import DirectionComponent from "DirectionComponent";

/**
 * Walks forward until it bumps into something.
 */
export default class WalkForwardMovementController {
	constructor(callback) {
		this.callback = callback;
	}

	getTarget(game, dt, position, entity) {
		const em = game.em;
		let dir = em.getComponent(entity, DirectionComponent).value;
		let dx = direction.getDeltaX(dir), dy = direction.getDeltaY(dir);

		if (game.isSolid(position.x + dx, position.y + dy)) {
			this.callback();
			return direction.NO_DIRECTION;
		}

		return dir;
	}
}
