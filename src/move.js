import * as type from "type";

export const /* Status */ damageNone = 0x0, damagePhysical = 0x1, damageSpecial = 0x2;

export default class Move {
	/**
	 * @param accuracy The accuracy in percent.
	 * @param power The base power.
	 */
	constructor(name, type, pp, power, accuracy, damageClass, priority) {
		if (priority < -7 || priority > 5) throw new Error();
		this.name = name;
		this.type = type;
		this.power = power;
		this.pp = pp;
		this.accuracy = accuracy;
		this.damageClass = damageClass;
		this.priority = priority || 0;

		if (new.target === Move) Object.freeze(this);
	}

	getType() {
		return this.type;
	}

	toString() {
		return `${this.name} (${this.type} - ${this.power === 1 ? 'X' : this.power} power - ${this.accuracy} accuracy)`;
	}
}

/** Collection of all moves. */
export const moves = Object.freeze({
	tackle: new Move("Tackle", type.normal, 35, 40, 100, damagePhysical),
	growl: new Move("Growl", type.normal, 40, 0, 100, damageNone),
});

export const getMoveByName = function(name) {
	if (!(name in move)) throw new Error("Move doesn't exist.");
	return moves[name];
};
