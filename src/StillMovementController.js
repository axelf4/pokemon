var direction = require("direction");

var StillMovementController = function() {};

StillMovementController.prototype.getTarget = function(dt, context, position, entity) {
	return direction.NO_DIRECTION;
};

module.exports = StillMovementController;
