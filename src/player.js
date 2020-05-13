import * as input from "input";
import * as direction from "direction";
import Position from "Position";
import { Movement } from "movement";

var keys = input.keys;

export class PlayerMovementController {
	getTarget(game, time, entity, position) {
		let em = game.em;
		let pos = entity.position, dir = entity.directionComponent;

		let dx = 0, dy = 0;
		if (keys["a"]) {
			dir.value = direction.LEFT;
			dx = -1;
		} else if (keys["d"]) {
			dir.value = direction.RIGHT;
			dx = 1;
		} else if (keys["w"]) {
			dir.value = direction.UP;
			dy = -1;
		} else if (keys["s"]) {
			dir.value = direction.DOWN;
			dy = 1;
		}

		if (dx != 0 || dy != 0) {
			// Check for push triggers
			var triggered = false;
			var tileX = pos.x + dx, tileY = pos.y + dy;
			var pushTriggers = game.getPushTriggers();
			for (var i = 0, length = pushTriggers.length; i < length; ++i) {
				if (pushTriggers[i].runForTile(tileX, tileY)) {
					triggered = true;
				}
			}
			// Check for collision if there were no trigger
			if (!triggered && !game.isSolid(tileX, tileY)) {
				return dir.value;
			}
		}
		return direction.NO_DIRECTION;
	}
}

export function createPlayer(game, loader, em) {
	const player = em.createEntity()
		.addComponent(Position)
		.addComponent(direction.DirectionComponent, direction.DOWN)
		.addComponent(Movement, new PlayerMovementController())
	game.loadCharacterSprite(player, "assets/playerSprite.png");
	return player;
}
