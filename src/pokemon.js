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
		get moveSet() { return this[8]; }, // TODO
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

/** An instance of a pokemon. */
export default class Pokemon {
	constructor(species, level, moves) {
		this.species = typeof species === "string" ? getPokemonByName(species) : species;
		this.name = this.species.name; // Allow renaming pokemon
		this.level = level;
		this.exp = 0;
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

	getHpPercentage() {
		return this.hp / this.calculateStats().hp;
	}
}
