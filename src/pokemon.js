/**
 * @file Pokemon data types and definitions.
 *
 * A distinction is made between species and instances of Pokémon. A species is
 * the type of Pokémon, whereas an instance is an actual Pokémon, whose life
 * can be depleted, et cetera.
 */

import * as types from "type";
/** name, hp, attack, defense, sp.att, sp.def, speed, types, moveSet */
import table from "pokemon.json";
import {moves} from "./move";

/**
 * Returns the pokemon with the specified identifier.
 * @param name The identifier of the pokemon to return.
 * @return The pokemon in question.
 */
export const getPokemonByName = (function() {
	const proto = {
		get name() { return this[0]; },
		get hp() { return this[1]; },
		get attack() { return this[2]; },
		get defense() { return this[3]; },
		get specialAttack() { return this[4]; },
		get specialDefense() { return this[5]; },
		get speed() { return this[6]; },
		get types() { return this[7].map(typeName => types[typeName]); },
		get moveSet() { return Object.fromEntries(Object.entries(this[8])
			.map(([k, v]) => [+k, moves[v]])); },
	};
	return function(name) {
		if (!table.hasOwnProperty(name)) throw new Error("Cannot find the pokemon named `" + name + "`.")
		return Object.freeze(Object.assign(Object.create(proto), table[name]));
	};
})();

/** Dictionary of all Pokémon species. */
export const pokemons = new Proxy(table, {
	get(target, prop, receiver) {
		return getPokemonByName(prop);
	}
});

/**
 * Returns the total amount of experience required for the next level.
 * @param level The current level.
 * @return The amount of experience required for the next level.
 */
export const getTotalExpForLevel = level => 4 * level ** 3 / 5 | 0;

/**
 * Enumeration of non-volatile status conditions.
 *
 * A Pokémon can only be afflicted by one at a time and they remain outside of
 * battle and after being switched out.
 *
 * @see https://bulbapedia.bulbagarden.net/wiki/Status_condition#Non-volatile_status
 */
export const nonVolatileStatuses = Object.freeze({
	burn: Symbol("burn"),
	freeze: Symbol("freeze"),
	paralysis: Symbol("paralysis"),
	poison: Symbol("poison"),
	sleep: Symbol("sleep"),
});

/** Highest number of moves a pokemon can know at any one time. */
export const maxMoveCount = 4;

/**
 * Returns the moves for a wild pokemon of some level.
 *
 * When encountered, a wild Pokémon's moveset will generally consist of the
 * most recent four moves its species would know by leveling-up.
 */
function getMovesForLevel(pokemon, level) {
	return Object.entries(pokemon.moveSet)
		.filter(([l, ]) => l <= level)
		.sort(([a, ], [b, ]) => b - a) // Highest level first
		.splice(maxMoveCount)
		.map(([l, m]) => m);
}

/** An instance of a pokemon. */
export default class Pokemon {
	constructor(species, level, moves) {
		this.species = typeof species === "string" ? getPokemonByName(species) : species;
		this.nickname = null;
		this.level = level;
		this.exp = 0;
		this.hp = this.calculateStats().hp;
		this.moves = moves.map(move => Object.create(move, { pp: {value: move.pp, writable: true}}));
		this.nonVolatileStatus = null; // The current non-volatile status condition or null

		if (new.target === Pokemon) Object.seal(this);
	}

	// TODO add JSON de/serialization

	/**
	 * Calculates the individual base stats of the pokemon.
	 * Based on level, returns hp; attack; defense; sp. attack; sp. defense and speed.
	 * Does not care about IVs nor EVs.
	 * @return An object with the stats.
	 */
	calculateStats() {
		const stats = this.species, getStat = base => 2 * base * this.level / 100 + 5 | 0;
		return {
			hp: 2 * stats.hp * this.level / 100 + this.level + 10 | 0,
			attack: getStat(stats.attack),
			defense: getStat(stats.defense),
			specialAttack: getStat(stats.specialAttack),
			specialDefense: getStat(stats.specialDefense),
			speed: getStat(stats.speed),
		};
	};

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
