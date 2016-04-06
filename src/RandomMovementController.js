var Direction = require("Direction.js");

var RandomMovementController = function() {
	this.timer = 0;
};
RandomMovementController.prototype.getTarget = function(dt, context, position, entity) {
	this.timer += dt;
	if (this.timer < 2) {
		return null;
	}
	this.timer = 0;
	var possible = [];
	if (!context.isSolid(position.x - 1, position.y)) possible.push(Direction.LEFT);
	if (!context.isSolid(position.x + 1, position.y)) possible.push(Direction.RIGHT);
	if (!context.isSolid(position.x, position.y - 1)) possible.push(Direction.UP);
	if (!context.isSolid(position.x, position.y + 1)) possible.push(Direction.DOWN);
	if (possible.length > 0) {
		var i = Math.floor(Math.random() * possible.length);
		return possible[i];
	}
	return null;
};

module.exports = RandomMovementController;
