var LEFT = exports.LEFT = 0x11;
var UP = exports.UP = 0x21;
var RIGHT = exports.RIGHT = 0x42;
var DOWN = exports.DOWN = 0x82;
exports.NO_DIRECTION = 0;

exports.getDeltaX = function(direction) {
	return direction === LEFT ? -1 : (direction === RIGHT ? 1 : 0);
};

exports.getDeltaY = function(direction) {
	return direction === UP ? -1 : (direction === DOWN ? 1 : 0);
};

exports.getReverse = function(direction) {
	switch (direction) {
		case LEFT: return RIGHT;
		case UP: return DOWN;
		case RIGHT: return LEFT;
		case DOWN: return UP;
		default: throw new Error("The specified direction is invalid.");
	}
};
