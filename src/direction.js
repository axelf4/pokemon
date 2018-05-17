const Position = require("Position");

export const LEFT = 0x11, UP = 0x21, RIGHT = 0x42, DOWN = 0x82,
	   NO_DIRECTION = 0;

export const getDeltaX = function(direction) {
	return direction === LEFT ? -1 : (direction === RIGHT ? 1 : 0);
};

export const getDeltaY = function(direction) {
	return direction === UP ? -1 : (direction === DOWN ? 1 : 0);
};

/**
 * Returns the reverse direction.
 */
export const getReverse = function(direction) {
	switch (direction) {
		case LEFT: return RIGHT;
		case UP: return DOWN;
		case RIGHT: return LEFT;
		case DOWN: return UP;
		default: throw new Error("The specified direction is invalid.");
	}
};

export const getDirectionToPos = function(pos1, pos2) {
	var dx = pos1.x - pos2.x, dy = pos1.y - pos2.y;
	if (dx > 0) return LEFT;
	else if (dy > 0) return UP;
	else if (dx < 0) return RIGHT;
	else if (dy < 0) return DOWN;
	else return NO_DIRECTION;
};

export const getPosInDirection = function(pos, dir) {
	const dx = getDeltaX(dir), dy = getDeltaY(dir);
	return new Position(pos.x + dx, pos.y + dy);
};
