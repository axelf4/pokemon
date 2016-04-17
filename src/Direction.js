var Direction = function(value) {
	this.value = value;
};

Direction.LEFT = 0;
Direction.RIGHT = 1;
Direction.UP = 2;
Direction.DOWN = 3;
/*
 * @deprecated
 */
Direction.prototype.NO_DIRECTION = 4;

Direction.prototype.getDeltaX = function() {
	return this.value === Direction.LEFT ? -1 : (this.value === Direction.RIGHT ? 1 : 0);
};

Direction.prototype.getDeltaY = function() {
	return this.value === Direction.UP ? -1 : (this.value === Direction.DOWN ? 1 : 0);
};

Direction.getDeltaX = function(direction) {
	return direction === Direction.LEFT ? -1 : (direction === Direction.RIGHT ? 1 : 0);
};

Direction.getDeltaY = function(direction) {
	return direction === Direction.UP ? -1 : (direction === Direction.DOWN ? 1 : 0);
};

module.exports = Direction;
