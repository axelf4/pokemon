/* The new movement system */

var Position = require("Position.js");
import * as direction from "direction";
var DirectionComponent = require("DirectionComponent.js");
var LineOfSightComponent = require("LineOfSightComponent");


/** Amount of ticks it takes to move one grid at slowest speed. */
export const BASE_SPEED = 300;
export const STILL = 0x0, SPEED_ONE = 0x1, SPEED_TWO = 0x2;

export class MovementComponent {
	constructor(controller) {
		if (!controller) throw new ReferenceError("The specified controller must not be null.");
		this.controllerStack = [controller];
		this.state = 0;
	}

	get controller() {
		if (this.controllerStack.length <= 0) throw new Error("The controller stack was unexpectedly empty.");
		return this.controllerStack[this.controllerStack.length - 1];
	}

	getController() {
		return this.controller;
	}

	pushController(controller) {
		this.controllerStack.push(controller);
	}

	popController() {
		if (this.controllerStack.length <= 1) throw new Error("Cannot pop the last controller.");
		this.controllerStack.pop();
	};

	isMoving() {
		return this.state != STILL;
	}

	getInterpolationValue(time) {
		if (!this.isMoving()) return 0;
		const duration = BASE_SPEED >>> (this.state - 1);
		return time % duration / duration;
	}

	snap() {
		this.state = STILL;
	}
}

export class MovementSystem {
	constructor(game) {
		this.game = game;
		const em = game.em;
		this.mask = em.getMask([Position, DirectionComponent, MovementComponent]);
		this.lOSMask = em.getMask([Position, DirectionComponent, LineOfSightComponent]);
	}

	/**
	 * @param entity1 The entity that checks if it stepped into other entities' lOS.
	 * @param enterDirection The direction from which the entity entered lOS from
	 */
	checkLineOfSight(game, em, entity1) {
		const pos1 = em.getComponent(entity1, Position),
		dir1 = em.getComponent(entity1, DirectionComponent).value;

		// Check if we caught another entity in our lOS
		if (em.hasComponent(entity1, LineOfSightComponent)) {
			const lOS = em.getComponent(entity1, LineOfSightComponent),
				blocker = game.findEntityInLineOfSight(entity1);
			if (blocker !== -1) {
				if (lOS.currentBlocker !== blocker) {
					lOS.currentBlocker = blocker;
					lOS.script(game, em, entity1, blocker);
				}
			} else {
				lOS.currentBlocker = null;
			}
		}

		// TODO handle case where we stepped into a short lOS
		// Check if we stepped into other entity's lOS
		for (var entity2 = 0, length = em.count; entity2 < length; ++entity2) {
			if (entity2 === entity1) continue; // Can't see itself

			if (em.matches(entity2, this.lOSMask)) {
				var blocker = game.findEntityInLineOfSight(entity2);
				if (blocker === entity1) {
					const pos2 = em.getComponent(entity2, Position);
					const dirBetween = direction.getDirectionToPos(pos2, pos1);
					if (dirBetween !== dir1 && dirBetween !== direction.getReverse(dir1)) {
						var lOS = em.getComponent(entity2, LineOfSightComponent);
						lOS.currentBlocker = blocker;
						lOS.script(game, em, entity2, blocker);
					}
				}
			}
		}
	}

	update(dt, time) {
		const game = this.game, em = game.em;
		for (var entity = 0, length = em.count; entity < length; ++entity) {
			if (em.matches(entity, this.mask)) {
				const position = em.getComponent(entity, Position),
					directionComponent = em.getComponent(entity, DirectionComponent),
					movement = em.getComponent(entity, MovementComponent);

				const altSpeed = 1;
				const past = time % (BASE_SPEED >>> (altSpeed - 1));
				if (dt > past) {
					if (movement.state != STILL) {
						this.checkLineOfSight(game, em, entity);
					}

					const newDirection = movement.getController().getTarget(this.game, dt, position, entity);
					if (newDirection !== direction.NO_DIRECTION) {
						if (newDirection === null) throw new Error("The specified direction should be NO_DIRECTION instead of null.");
						directionComponent.value = newDirection;
						position.x += direction.getDeltaX(newDirection);
						position.y += direction.getDeltaY(newDirection);

						movement.state = SPEED_ONE;
					} else {
						movement.state = STILL;
					}
				}
			}
		}
	}
}
