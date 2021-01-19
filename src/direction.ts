enum Direction {
	Up = 0b00, Right = 0b01, Down = 0b11, Left = 0b10
}
export default Direction;

export function getDeltaX(dir: Direction): number {
	return dir === Direction.Left ? -1 : (dir === Direction.Right ? 1 : 0);
}

export function getDeltaY(dir: Direction): number {
	return dir === Direction.Up ? -1 : (dir === Direction.Down ? 1 : 0);
}

/**
 * Returns the reverse direction.
 */
export function getReverse(dir: Direction): Direction {
	return dir ^ 0b11;
}

interface Position {
	x: number;
	y: number;
}

export function getDirectionToPos(pos1: Position, pos2: Position): Direction | null {
	let dx = pos1.x - pos2.x, dy = pos1.y - pos2.y;

	if (dx > 0) return Direction.Left;
	else if (dy > 0) return Direction.Up;
	else if (dx < 0) return Direction.Right;
	else if (dy < 0) return Direction.Down;
	else return null;
}

export function getPosInDirection(pos: Position, dir: Direction): Position {
	const dx = getDeltaX(dir), dy = getDeltaY(dir);
	return { x: pos.x + dx, y: pos.y + dy };
};

export class DirectionComponent {
	constructor(_entity: any, public value: Direction | null) {}
}
