/**
 * @file Pokemon data types and definitions.
 *
 * A distinction is made between species and instances of Pokémon. A species is
 * the type of Pokémon, whereas an instance is an actual Pokémon, whose life
 * can be depleted, et cetera.
 */

/** name, hp, attack, defense, sp.att, sp.def, speed, types, moveSet */
import table from "./pokemonData.json";
import { mapValues } from "./utils";

export enum Type {
	Normal, Fight, Flying, Poison, Ground, Rock, Bug, Ghost, Steel,
	Fire, Water, Grass, Electric, Psychic, Ice, Dragon, Dark,
}

export type Stats
	= Record<'hp' | 'attack' | 'defense' | 'specialAttack' | 'specialDefense' | 'speed', number>;

export interface Species extends Stats {
	name: string;
	types: Type[];
	moveSet: {[level: number]: Move};
}

class SpeciesView implements Species {
	constructor(private readonly data: (typeof table)[keyof typeof table]) {}

	get name() { return this.data.name; }
	get hp() { return this.data.hp; }
	get attack() { return this.data.attack; }
	get defense() { return this.data.defense; }
	get specialAttack() { return this.data.specialAttack; }
	get specialDefense() { return this.data.specialDefense; }
	get speed() { return this.data.speed; }
	get types() { return this.data.types.map(x => Type[x as keyof typeof Type]); }
	get moveSet() { return Object.fromEntries(Object.entries(this.data.moveSet)
		.map(([level, move]) => [+level, Move[move as keyof typeof Move]])); }
}

/** Dictionary of pokemon species. */
export const pokemons: {[K in keyof typeof table]: Species}
	= mapValues(table, data => new SpeciesView(data));

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

export class MoveStats {
	/**
	 * Constructs a new move statistics with the given values.
	 *
	 * @param accuracy The accuracy in percent.
	 * @param power The base power.
	 */
	constructor(
		public readonly name: string,
		public readonly type: Type,
		public readonly pp: number,
		public readonly power: number,
		public readonly accuracy: number,
		public readonly damageCategory: DamageCategory,
		public readonly priority: Priority = 0
	) {}

	public toString() {
		return `${this.name} (${this.type} - ${this.power === 1 ? 'X' : this.power} power - ${this.accuracy} accuracy)`;
	}
}

/** Collection of all moves. */
export enum Move {
	Tackle,
	Growl,
}

export function moveStats(move: Move): MoveStats {
	switch (move) {
		case Move.Tackle:
			return new MoveStats("Tackle", Type.Normal, 35, 40, 100, DamageCategory.Physical);
		case Move.Growl:
			return new MoveStats("Growl", Type.Normal, 40, 0, 100, DamageCategory.Status);
	}
}

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

/** An instance of a move whose PP can be depleted. */
export interface MoveInstance {
	/** What move this is. */
	type: Move;
	/** The current remaining uses of this move. */
	pp: number;
}

/** An instance of a pokemon. */
export default class Pokemon {
	public species: Species;
	private nickname?: string;
	public level: number;
	public exp: number = 0;
	public hp: number;
	public moves: MoveInstance[];
	private nonVolatileStatus?: NonVolatileStatus;

	constructor(species: Species | keyof typeof pokemons, level: number, moves?: Move[]) {
		this.species = typeof species === "string" ? pokemons[species] : species;
		this.level = level;
		this.hp = this.calculateStats().hp;
		this.moves = (moves || getMovesForLevel(this.species, level))
						 .map(move => ({type: move, pp: moveStats(move).pp}));

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
