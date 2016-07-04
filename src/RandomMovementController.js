var direction = require("direction.js");

var RandomMovementController = function() {
	this.timer = 0;
};

RandomMovementController.prototype.getTarget = function(game, dt, position, entity) {
	this.timer += dt;
	if (this.timer < 2000) {
		return null;
	}
	this.timer = 0;
	var possible = [];
	if (!game.isSolid(position.x - 1, position.y)) possible.push(direction.LEFT);
	if (!game.isSolid(position.x + 1, position.y)) possible.push(direction.RIGHT);
	if (!game.isSolid(position.x, position.y - 1)) possible.push(direction.UP);
	if (!game.isSolid(position.x, position.y + 1)) possible.push(direction.DOWN);
	if (possible.length > 0) {
		return possible[Math.floor(Math.random() * possible.length)];
	}
	return direction.NO_DIRECTION;
};

module.exports = RandomMovementController;
