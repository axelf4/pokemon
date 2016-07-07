var Position = require("Position.js");
var direction = require("direction.js");
var DirectionComponent = require("DirectionComponent.js");
var OldPosition = require("OldPosition.js");
var MovementComponent = require("MovementComponent.js");
var LineOfSightComponent = require("LineOfSightComponent");

var MovementSystem = function(game) {
	this.game = game;
	var em = game.em;
	this.mask = em.getMask([Position, OldPosition, DirectionComponent, MovementComponent]);
	this.lOSMask = em.getMask([Position, OldPosition, DirectionComponent, LineOfSightComponent]);
};

/**
 * @param entity1 The entity that checks if it stepped into other entities' LoS.
 */
MovementSystem.prototype.checkLineOfSight = function(game, em, entity1) {
	var pos1 = em.getComponent(entity1, Position);
	var oldpos1 = em.getComponent(entity1, OldPosition);
	var movement1 = em.getComponent(entity1, MovementComponent);

	for (var entity = 0, length = em.count; entity < length; ++entity) {
		if (entity === entity1) continue; // Can't see itself!

		if (em.matches(entity, this.lOSMask)) {
			var pos2 = em.getComponent(entity, Position);
			var dir = em.getComponent(entity, DirectionComponent).value; // The direction of the line of sight
			var losComponent = em.getComponent(entity, LineOfSightComponent); // LoS

			for (var step = 1, max = losComponent.length; max === -1 || step <= max; ++step) {
				var x = pos2.x + step * direction.getDeltaX(dir);
				var y = pos2.y + step * direction.getDeltaY(dir);

				if (pos1.x === x && pos1.y === y) {
					var op = losComponent.triggerCheck(game, em, entity, entity1);
					switch (op) {
						case LineOfSightComponent.LOS_NO_ACTION:
							break;
						case LineOfSightComponent.LOS_TRIGGER_AND_SNAP:
							movement1.timer = 0;
							if (em.hasComponent(entity, MovementComponent)) em.getComponent(entity, MovementComponent).timer = 0;

							// Snap the entity to the next tile
							if (em.hasComponent(entity, OldPosition)) {
								var oldpos2 = em.getComponent(entity, OldPosition);
								oldpos2.x = pos2.x;
								oldpos2.y = pos2.y;
							}
							// Intentional fall-through
						case LineOfSightComponent.LOS_TRIGGER:
							losComponent.script(game, em, entity, entity1);
							break;
						default:
							throw new Error("Invalid return value of triggerCheck.");
					}
				}

				// If the sight is obstructed: quit
				if (game.isSolid(x, y)) {
					break;
				}

			}
		}
	}
};

MovementSystem.prototype.update = function(dt, time) {
	var game = this.game;
	var em = game.em;
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
				// Check if we stepped into an entity's line of sight
				this.checkLineOfSight(game, em, entity);

				movement.timer = Math.max(0, movement.timer - movement.delay);
				var newDirection = movement.getController().getTarget(this.game, dt, position, entity);
				if (newDirection !== direction.NO_DIRECTION) {
					if (newDirection === null) throw new Error("The specified direction should be NO_DIRECTION instead of null.");
					directionComponent.value = newDirection;
					position.x += direction.getDeltaX(newDirection);
					position.y += direction.getDeltaY(newDirection);
				}
			}
		}
	}
};

module.exports = MovementSystem;
