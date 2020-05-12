/**
 * @file Pokemon data types and definitions.
 *
 * A distinction is made between species and instances of Pokémon. A species is
 * the type of Pokémon, whereas an instance is an actual Pokémon, whose life
 * can be depleted, et cetera.
 */

/** name, hp, attack, defense, sp.att, sp.def, speed, types, moveSet */
import table from "./pokemon.json";

export enum Type {
	Normal, Fight, Flying, Poison, Ground, Rock, Bug, Ghost, Steel,
		Fire, Water, Grass, Electric, Psychic, Ice, Dragon, Dark
}

export interface Stats {
	hp: number;
	attack: number;
	defense: number;
	specialAttack: number;
	specialDefense: number;
	speed: number;
}

type Species = Stats & {
	name: string;
	types: Type[];
	moveSet: {[level: number]: Move};
};

/**
 * Dictionary of pokemon species.
 */
export const pokemons: {[name: string]: Species} = Object.fromEntries(Object.entries(table).map(([k, v]) => [k, Object.freeze(Object.assign(Object.create({
		get name(this: any[]) { return this[0]; },
		get hp(this: any[]) { return this[1]; },
		get attack(this: any[]) { return this[2]; },
		get defense(this: any[]) { return this[3]; },
		get specialAttack(this: any[]) { return this[4]; },
		get specialDefense(this: any[]) { return this[5]; },
		get speed(this: any[]) { return this[6]; },
		get types(this: any[]) { return this[7].map((typeName: string) => Type[typeName as keyof typeof Type]); },
		get moveSet(this: any[]) { return Object.fromEntries(Object.entries(this[8] as {[lvl: string]: string})
			.map(([k, v]) => [+k, moves[v]])); },
	}), v))]));

/**
 * Returns the total amount of experience required for the next level.
 * @param level The current level.
 * @return The amount of experience required for the next level.
 */
function getTotalExpForLevel(level: number) { return 4 * level ** 3 / 5 | 0; }

/**
 * Enumeration of non-volatile status conditions.
 *
 * A Pokémon can only be afflicted by one at a time and they remain outside of
 * battle and after being switched out.
 *
 * @see https://bulbapedia.bulbagarden.net/wiki/Status_condition#Non-volatile_status
 */
export enum NonVolatileStatus { Burn, Freeze, Paralysis, Poison, Sleep }

export enum DamageCategory { Physical, Special, Status }

type Priority = -7 | -6 | -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5;

export class Move {
	public name: string;
	public type: Type;
	public power: number;
	public pp: number;
	public accuracy: number;
	public damageCategory: DamageCategory;
	public priority: number;

	/**
	 * @param accuracy The accuracy in percent.
	 * @param power The base power.
	 */
	constructor(name: string, type: Type, pp: number, power: number, accuracy: number,
		damageCategory: DamageCategory, priority: Priority = 0) {
		this.name = name;
		this.type = type;
		this.power = power;
		this.pp = pp;
		this.accuracy = accuracy;
		this.damageCategory = damageCategory;
		this.priority = priority;

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
export const moves: {[name: string]: Move} = Object.freeze({
	tackle: new Move("Tackle", Type.Normal, 35, 40, 100, DamageCategory.Physical),
	growl: new Move("Growl", Type.Normal, 40, 0, 100, DamageCategory.Status),
});

/** Highest number of moves a pokemon can know at any one time. */
export const maxMoveCount = 4;

/**
 * Returns the moves for a wild pokemon of some level.
 *
 * When encountered, a wild Pokémon's moveset will generally consist of the
 * most recent four moves its species would know by leveling-up.
 */
export function getMovesForLevel(pokemon: Species, level: number): Move[] {
	return Object.entries(pokemon.moveSet)
		.filter(([l, ]) => +l <= level)
		.sort(([a, ], [b, ]) => +b - +a) // Highest level first
		.splice(maxMoveCount)
		.map(([l, m]) => m);
}

/** An instance of a pokemon. */
export default class Pokemon {
	public species: Species;
	private nickname?: string;
	public level: number;
	public exp: number = 0;
	public hp: number;
	public moves: Move[];
	private nonVolatileStatus?: NonVolatileStatus;

	constructor(species: Species | string, level: number, moves: Move[]) {
		this.species = typeof species === "string" ? pokemons[species] : species;
		this.level = level;
		this.hp = this.calculateStats().hp;
		this.moves = moves.map(move => Object.create(move, { pp: {value: move.pp, writable: true}}));

		if (new.target === Pokemon) Object.seal(this);
	}

	// TODO add JSON de/serialization

	/**
	 * Calculates the individual base stats of the pokemon.
	 * Based on level, returns hp; attack; defense; sp. attack; sp. defense and speed.
	 * Does not care about IVs nor EVs.
	 * @return An object with the stats.
	 */
	calculateStats(): Stats {
		let getStat = (base: number) => 2 * base * this.level / 100 + 5 | 0;
		return {
			hp: 2 * this.species.hp * this.level / 100 + this.level + 10 | 0,
			attack: getStat(this.species.attack),
			defense: getStat(this.species.defense),
			specialAttack: getStat(this.species.specialAttack),
			specialDefense: getStat(this.species.specialDefense),
			speed: getStat(this.species.speed),
		};
	}

	/** Returns the nickname or, if there is none, the name of the species. */
	get name() { return this.nickname || this.species.name; }

	isFainted() { return this.hp <= 0; }

	getHpPercentage() {
		return this.hp / this.calculateStats().hp;
	}

	getTotalExpForLevelUp() {
		return getTotalExpForLevel(this.level);
	}
}
