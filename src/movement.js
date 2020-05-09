import Position from "Position";
import * as direction from "direction";

/** Amount of ticks it takes to move one grid at slowest speed. */
export const BASE_SPEED = 250;
export const STILL = 0;

/** Movement component. */
export class Movement {
	constructor(self, controller) {
		if (!controller) throw new ReferenceError("The specified controller must not be null.");
		this.controllerStack = [controller];
		this.speed = 0;
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

	get isMoving() {
		return this.speed != STILL;
	}

	getInterpolationValue(time) {
		if (!this.isMoving) return 0;
		const duration = BASE_SPEED >>> (this.speed - 1);
		return time % duration / duration;
	}

	snap() {
		this.speed = STILL;
	}
}

// Constants returned by triggerCheck
export const LOS_NO_ACTION = 0,
	LOS_TRIGGER = 1,
	LOS_TRIGGER_AND_SNAP = 2;

export class LineOfSight {
	constructor(entity, script) {
		if (!script) throw new Error("script must not be null.");
		this.script = script;
		this.length = length || 16;
		this.currentBlocker = null; // The entity that is standing in our sights or null
	}
}

export class MovementSystem {
	constructor(game) {
		this.game = game;
	}

	/**
	 * @param entity1 The entity that checks if it stepped into other entities' lOS.
	 * @param enterDirection The direction from which the entity entered lOS from
	 */
	checkLineOfSight(game, em, entity1) {
		const pos1 = entity1.position,
			dir1 = entity1.directionComponent.value;

		// Check if we caught another entity in our lOS
		if (entity1.hasComponent(LineOfSight)) {
			const lOS = entity1.lineOfSight,
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
		let entities = em.queryComponents([Position, direction.DirectionComponent, LineOfSight])
		for (let entity2 of entities) {
			if (entity2 === entity1) continue; // Can't see itself

			var blocker = game.findEntityInLineOfSight(entity2);
			if (blocker === entity1) {
				const pos2 = entity2.position;
				const dirBetween = direction.getDirectionToPos(pos2, pos1);
				if (dirBetween !== dir1 && dirBetween !== direction.getReverse(dir1)) {
					let lOS = entity2.lineOfSight;
					lOS.currentBlocker = blocker;
					lOS.script(game, em, entity2, blocker);
				}
			}
		}
	}

	update(dt, time) {
		let game = this.game, em = game.em;
		let entities = em.queryComponents([Position, direction.DirectionComponent, Movement]);
		for (let entity of entities) {
			let position = entity.position,
				directionComponent = entity.directionComponent,
				movement = entity.movement;

			const altSpeed = 1;
			const past = time % (BASE_SPEED >>> (altSpeed - 1));
			if (dt > past) {
				if (movement.isMoving) {
					this.checkLineOfSight(game, em, entity);
				}

				const newDirection = movement.controller.getTarget(this.game, dt, position, entity);
				if (newDirection !== direction.NO_DIRECTION) {
					if (newDirection === null) throw new Error("The specified direction should be NO_DIRECTION instead of null.");
					directionComponent.value = newDirection;
					position.x += direction.getDeltaX(newDirection);
					position.y += direction.getDeltaY(newDirection);

					movement.speed = 1;
				} else {
					movement.speed = STILL;
				}
			}
		}
	}
}

export class StillMovementController {
	getTarget(dt, context, position, entity) { return direction.NO_DIRECTION; }
}

/**
 * Walks forward until it bumps into something.
 */
export class WalkForwardMovementController {
	constructor(callback) {
		this.callback = callback;
	}

	getTarget(game, dt, position, entity) {
		let dir = entity.directionComponent.value;
		let dx = direction.getDeltaX(dir), dy = direction.getDeltaY(dir);

		if (game.isSolid(position.x + dx, position.y + dy)) {
			this.callback();
			return direction.NO_DIRECTION;
		}

		return dir;
	}
}

export class RandomMovementController {
	contructor(interval) {
		this.interval = interval || 2000;
		this.timer = 0;
	}

	getTarget(game, dt, position, entity) {
		this.timer += dt;
		if (this.timer >= this.interval) {
			this.timer -= this.interval;
			let possible = [];
			if (!game.isSolid(position.x - 1, position.y)) possible.push(direction.LEFT);
			if (!game.isSolid(position.x + 1, position.y)) possible.push(direction.RIGHT);
			if (!game.isSolid(position.x, position.y - 1)) possible.push(direction.UP);
			if (!game.isSolid(position.x, position.y + 1)) possible.push(direction.DOWN);
			if (possible.length > 0) {
				return possible[Math.floor(Math.random() * possible.length)];
			}
		}
		return direction.NO_DIRECTION;
	}
}

export class PathMovementController {
	constructor(path, callback) {
		this.path = path;
		this.callback = callback;
	}

	/**
	 * @warning If you try to walk into something solid you could get stuck indefinitely.
	 */
	getTarget(game, dt, position, entity) {
		if (this.path.length === 0) {
			this.callback();
			return direction.NO_DIRECTION;
		}

		// Check for collisions
		const dir = this.path[0];
		const dx = direction.getDeltaX(dir), dy = direction.getDeltaY(dir);
		if (game.isSolid(position.x + dx, position.y + dy)) {
			return direction.NO_DIRECTION;
		}

		return this.path.shift();
	}
}
