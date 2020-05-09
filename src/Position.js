export default class Position {
	constructor(entity, x, y) {
		this.x = x || 0;
		this.y = y || 0;
	}

	set(x, y) {
		this.x = x;
		this.y = y;
	}
}
