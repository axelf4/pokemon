var Position = require("Position.js");
var direction = require("direction.js");
var DirectionComponent = require("DirectionComponent.js");
var OldPosition = require("OldPosition.js");
var MovementComponent = require("MovementComponent.js");

var MovementSystem = function(game) {
	this.game = game;
	var em = game.em;
	this.mask = em.getMask([Position, OldPosition, DirectionComponent, MovementComponent]);
};

MovementSystem.prototype.update = function(dt, time) {
	var em = this.game.em;
	for (var entity = 0, length = em.count; entity < length; ++entity) {
		if (em.matches(entity, this.mask)) {
			var position = em.getComponent(entity, Position);
			var oldpos = em.getComponent(entity, OldPosition);
			var directionComponent = em.getComponent(entity, DirectionComponent);
			var movement = em.getComponent(entity, MovementComponent);

			var still = position.x === oldpos.x && position.y === oldpos.y; // Whether we need new direction
			if (!still) {
				movement.timer += dt;
				if (movement.timer >= movement.delay) {
					oldpos.x = position.x;
					oldpos.y = position.y;
					still = true;
				}
			}
			if (still) {
				movement.timer = Math.max(0, movement.timer - movement.delay);
				var newDirection = movement.getController().getTarget(this.game, dt, position, entity);
				if (newDirection !== direction.NO_DIRECTION) {
					directionComponent.value = newDirection;
					position.x += direction.getDeltaX(newDirection);
					position.y += direction.getDeltaY(newDirection);
				}
			}
		}
	}
};

module.exports = MovementSystem;
