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

/**
 * @param entity1 The entity that checks if it stepped into other entities' LoS.
 * @param enterDirection The direction from which the entity entered LoS from
 */
MovementSystem.prototype.checkLineOfSight = function(game, em, entity1, enterDirection) {
	var pos1 = em.getComponent(entity1, Position);
	var finds = [];

	// Check if we caught another entity in our LoS
	if (em.hasComponent(entity1, LineOfSightComponent)) {
		var LoS = em.getComponent(entity1, LineOfSightComponent);

		var blocker = game.findEntityInLineOfSight(entity1);
		if (blocker !== -1) {
			if (LoS.currentBlocker !== blocker) {
				finds.push({
					caster: entity1,
					blocker: blocker
				});
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
				if (dirBetween !== enterDirection && dirBetween !== direction.getReverse(enterDirection)) {
					finds.push({
						caster: entity2,
						blocker: blocker
					});
				}
			}
		}
	}

	if (finds.length === 2 && finds[0] === finds[1]) finds.pop();

	finds.forEach(find => {
		var LoS = em.getComponent(find.caster, LineOfSightComponent);
		LoS.currentBlocker = find.blocker;
		var op = LoS.triggerCheck(game, em, find.caster, find.blocker);
		switch (op) {
			case LineOfSightComponent.LOS_NO_ACTION:
				break;
			case LineOfSightComponent.LOS_TRIGGER_AND_SNAP:
				if (em.hasComponent(find.caster, MovementComponent)) em.getComponent(find.caster, MovementComponent).timer = 0;
				if (em.hasComponent(find.blocker, MovementComponent)) em.getComponent(find.blocker, MovementComponent).timer = 0;

				// Snap the entity to the next tile
				var entityToSnap = entity1 === find.caster ? find.blocker : find.caster; // entity1 has already been snapped
				if (em.hasComponent(entityToSnap, OldPosition)) {
					var pos = em.getComponent(entityToSnap, Position);
					var oldpos = em.getComponent(entityToSnap, OldPosition);
					oldpos.x = pos.x;
					oldpos.y = pos.y;
				}
				// Intentional fall-through
			case LineOfSightComponent.LOS_TRIGGER:
				LoS.script(game, em, find.caster, find.blocker, enterDirection);
				break;
			default:
				throw new Error("Invalid return value of triggerCheck.");
		}
	});
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
			var enterDirection = direction.NO_DIRECTION;
			if (!still) {
				movement.timer += dt;
				if (movement.timer >= movement.delay) {
					oldpos.x = position.x;
					oldpos.y = position.y;
					still = true;

					enterDirection = direction.getReverse(directionComponent.value);
					// Check if we stepped into an entity's line of sight
					this.checkLineOfSight(game, em, entity, enterDirection);
				}
			}
			if (still) {

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
