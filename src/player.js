import * as input from "input";
import * as direction from "direction";
var Position = require("Position.js");
import DirectionComponent from "DirectionComponent";
var SpriteComponent = require("SpriteComponent.js");
var InteractionComponent = require("InteractionComponent.js");
import { MovementComponent } from "movement";
var Animation = require("Animation.js");
var texture = require("texture.js");
var AnimationComponent = require("AnimationComponent");

var keys = input.keys;

export class PlayerMovementController {
	getTarget(game, dt, position, entity) {
		let em = game.em;
		let pos = em.getComponent(entity, Position);
		let dir = em.getComponent(entity, DirectionComponent);

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
	const player = em.createEntity();
	em.addComponent(player, new Position());
	em.addComponent(player, new DirectionComponent(direction.DOWN));
	em.addComponent(player, new MovementComponent(new PlayerMovementController()));

	game.loadCharacterSprite(player, "assets/playerSprite.png");

	return player;
}
