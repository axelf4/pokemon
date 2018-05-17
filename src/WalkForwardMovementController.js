import * as direction from "direction";
var DirectionComponent = require("DirectionComponent");

/**
 * Walks forward until it bumps into something.
 */
var WalkForwardMovementController = function(callback) {
	this.callback = callback;
};

WalkForwardMovementController.prototype.getTarget = function(game, dt, position, entity) {
	var em = game.em;
	var dir = em.getComponent(entity, DirectionComponent).value;
	var dx = direction.getDeltaX(dir), dy = direction.getDeltaY(dir);

	if (game.isSolid(position.x + dx, position.y + dy)) {
		this.callback();
		return direction.NO_DIRECTION;
	}

	return dir;
};

module.exports = WalkForwardMovementController;
