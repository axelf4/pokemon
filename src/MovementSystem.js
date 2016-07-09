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
	this.LoSMask = em.getMask([Position, OldPosition, DirectionComponent, LineOfSightComponent]);
};

MovementSystem.prototype.handleLineOfSightObtrusion = function(game, em, entity1, caster, blocker) {
	var LoS = em.getComponent(caster, LineOfSightComponent);
	LoS.currentBlocker = blocker;
	var op = LoS.triggerCheck(game, em, caster, blocker);
	switch (op) {
		case LineOfSightComponent.LOS_NO_ACTION:
			break;
		case LineOfSightComponent.LOS_TRIGGER_AND_SNAP:
			if (em.hasComponent(caster, MovementComponent)) em.getComponent(caster, MovementComponent).timer = 0;
			if (em.hasComponent(blocker, MovementComponent)) em.getComponent(blocker, MovementComponent).timer = 0;

			// Snap the entity to the next tile
			var entityToSnap = entity1 === caster ? blocker : caster; // entity1 has already been snapped
			if (em.hasComponent(entityToSnap, OldPosition)) {
				var pos = em.getComponent(entityToSnap, Position);
				var oldpos = em.getComponent(entityToSnap, OldPosition);
				oldpos.x = pos.x;
				oldpos.y = pos.y;
			}
			// Intentional fall-through
		case LineOfSightComponent.LOS_TRIGGER:
			LoS.script(game, em, caster, blocker);
			break;
		default:
			throw new Error("Invalid return value of triggerCheck.");
	}
};

/**
 * @param entity1 The entity that checks if it stepped into other entities' LoS.
 */
MovementSystem.prototype.checkLineOfSight = function(game, em, entity1) {
	var pos1 = em.getComponent(entity1, Position);
	var dir1 = em.getComponent(entity1, DirectionComponent).value;

	// Check if we caught another entity in our LoS
	if (em.hasComponent(entity1, LineOfSightComponent)) {
		var LoS = em.getComponent(entity1, LineOfSightComponent);

		var blocker = game.findEntityInLineOfSight(entity1);
		if (blocker !== -1) {
			if (LoS.currentBlocker !== blocker) {
				this.handleLineOfSightObtrusion(game, em, entity1, entity1, blocker);
			}
		} else {
			LoS.currentBlocker = null;
		}
	}

	// Check if we stepped into other entity's LoS
	for (var entity2 = 0, length = em.count; entity2 < length; ++entity2) {
		if (entity2 === entity1) continue; // Can't see itself

		if (em.matches(entity2, this.LoSMask)) {
			var blocker = game.findEntityInLineOfSight(entity2);
			if (blocker === entity1) {
				var pos2 = em.getComponent(entity2, Position);
				var dirBetween = direction.getDirectionToPos(pos2, pos1);
				if (dirBetween !== dir1 && dirBetween !== direction.getReverse(dir1)) {
					this.handleLineOfSightObtrusion(game, em, entity1, entity2, blocker);
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
				// If we have arrived at the new tile
				if (movement.timer >= movement.delay) {
					movement.timer -= movement.delay;
					oldpos.x = position.x;
					oldpos.y = position.y;
					still = true;

					this.checkLineOfSight(game, em, entity);
				}
			}

			if (still) {
				var newDirection = movement.getController().getTarget(this.game, dt, position, entity);
				if (newDirection !== direction.NO_DIRECTION) {
					if (newDirection === null) throw new Error("The specified direction should be NO_DIRECTION instead of null.");
					directionComponent.value = newDirection;
					position.x += direction.getDeltaX(newDirection);
					position.y += direction.getDeltaY(newDirection);
				} else {
					movement.timer = 0;
				}
			}
		}
	}
};

module.exports = MovementSystem;
