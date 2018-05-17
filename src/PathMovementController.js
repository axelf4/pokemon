import * as direction from "direction";

var PathMovementController = function(path, callback) {
	this.path = path;
	this.callback = callback;
};

/**
 * @warning If you try to walk into something solid you could get stuck indefinitely.
 */
PathMovementController.prototype.getTarget = function(game, dt, position, entity) {
	if (this.path.length === 0) {
		this.callback();
		return direction.NO_DIRECTION;
	}

	// Check for collisions
	var dir = this.path[0];
	var dx = direction.getDeltaX(dir), dy = direction.getDeltaY(dir);
	if (game.isSolid(position.x + dx, position.y + dy)) {
		return direction.NO_DIRECTION;
	}

	return this.path.shift();
};

module.exports = PathMovementController;
