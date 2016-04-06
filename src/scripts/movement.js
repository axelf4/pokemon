var Position = require("Position.js");
var Direction = require("Direction.js");
var OldPosition = require("OldPosition.js");
var MovementComponent = require("MovementComponent.js");

var update = function(dt, em, context) {
	em.each(function(entity) {
		var position = pos = em.getComponent(entity, Position);
		var oldpos = em.getComponent(entity, OldPosition);
		var direction = em.getComponent(entity, Direction);
		var movement = em.getComponent(entity, MovementComponent);

		movement.timer += dt;
		if (movement.timer >= movement.delay || pos.x === oldpos.x && pos.y === oldpos.y) {
			oldpos.x = pos.x;
			oldpos.y = pos.y;
			movement.timer = 0;
			var newDirection = new Direction(movement.getController().getTarget(dt, context, position, entity));
			pos.x += newDirection.getDeltaX();
			pos.y += newDirection.getDeltaY();
		}
	}, Position, OldPosition, Direction, MovementComponent);
};

module.exports = function(manager, context) {
	context.addUpdateHook(update);
};
