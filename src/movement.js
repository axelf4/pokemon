import Position from "Position";
import * as direction from "direction";

/** Amount of ticks it takes to move one grid at slowest speed. */
export const BASE_SPEED = 250,
	maxSpeed = 2, STILL = 0;

/** Movement component. */
export class Movement {
	constructor(self, controller) {
		if (!controller) throw new ReferenceError("The specified controller must not be null.");
		this.controllerStack = [controller];
		this.speed = 0;
	}

	get controller() {
		let controller = this.controllerStack[this.controllerStack.length - 1];
		if (!controller) throw new Error("The controller stack was unexpectedly empty.");
		return controller;
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
		const duration = BASE_SPEED / 2**(this.speed - 1);
		return time / duration % 1;
	}

	snap() {
		this.speed = STILL;
	}
}

export class LineOfSight {
	constructor(entity, script) {
		if (!script) throw new Error("script must not be null.");
		this.script = script;
		this.length = length || 8;
		this.currentBlocker = null; // The entity that is standing in our sights or null
	}
}

export class MovementSystem {
	constructor(game) {
		this.game = game;
		this.lastTime = null;
	}

	update(dt, time) {
		let lastTime = this.lastTime || time;
		if (time - lastTime > 1000) lastTime = time;
		this.lastTime = time;
		let game = this.game, em = game.em;
		let entities = em.queryComponents([Position, direction.DirectionComponent, Movement]);
		let casters = em.queryComponents([Position, direction.DirectionComponent, LineOfSight])

		// Discretize time into units of smallest move duration
		const dur = BASE_SPEED / 2**(maxSpeed - 1);
		for (let t = lastTime / dur + 1 | 0; t <= time / dur; ++t) {
			const isReadyToMove = speed => (t & (1 << maxSpeed - speed) - 1) === 0;

			// Check line of sights
			casterLoop:
			for (let caster of casters) {
				const pos1 = caster.position, lOS = caster.lineOfSight,
					dir = caster.directionComponent.value; // The direction of the line of sight
				let previousBlocker = lOS.currentBlocker;
				lOS.currentBlocker = null;
				const dx = direction.getDeltaX(dir), dy = direction.getDeltaY(dir);
				let speed1 = caster.hasComponent(Movement) ? caster.movement.speed : STILL;

				let found = em.queryComponents([Position])
					.map(entity => {
						let pos2 = entity.position;
						return [entity, pos2.x == pos1.x || pos2.y == pos1.y
							? (pos2.x - pos1.x) * dx + (pos2.y - pos1.y) * dy : 0];
					})
					.filter(([, d]) => 0 < d && d <= lOS.length) // Cannot see itself nor those behind
					.sort(([, a], [, b]) => a - b)[0];
				if (!found) continue;
				let [blocker, distance] = found;
				// If the sight is obstructed: ignore
				for (let i = 1; i < distance; ++i)
					if (game.isTileSolid(pos1.x + i * dx, pos1.y + i * dy))
						continue casterLoop;

				let speed2 = blocker.hasComponent(Movement) ? blocker.movement.speed : STILL;
				if (isReadyToMove(Math.max(speed1, speed2))) { // Do not snap unnecessarily
					lOS.currentBlocker = blocker;
					if (previousBlocker !== blocker) lOS.script(game, em, caster, blocker);
				} else lOS.currentBlocker = previousBlocker;
			}

			for (let entity of entities) {
				let position = entity.position,
					directionComponent = entity.directionComponent,
					movement = entity.movement;
				// TODO Ask entity what speed it wants to avoid having to wait for sync
				if (isReadyToMove(movement.speed || 1)) {
					const newDirection = movement.controller.getTarget(this.game, time, entity, position);
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
}

export class StillMovementController {
	getTarget(game, time, entity, position) { return direction.NO_DIRECTION; }
}

/**
 * Walks forward until it bumps into something.
 */
export class WalkForwardMovementController {
	constructor(callback) {
		this.callback = callback;
	}

	getTarget(game, time, entity, position) {
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
	contructor(interval = 2000) {
		this.interval = interval;
		this.lastTime;
	}

	getTarget(game, time, entity, position) {
		const prevTime = this.lastTime;
		this.lastTime = time;
		if (!prevTime || time - prevTime >= this.interval) {
			let possible = [];
			if (!game.isSolid(position.x - 1, position.y)) possible.push(direction.LEFT);
			if (!game.isSolid(position.x + 1, position.y)) possible.push(direction.RIGHT);
			if (!game.isSolid(position.x, position.y - 1)) possible.push(direction.UP);
			if (!game.isSolid(position.x, position.y + 1)) possible.push(direction.DOWN);
			if (possible.length > 0)
				return possible[Math.floor(Math.random() * possible.length)];
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
	getTarget(game, time, entity, position) {
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
