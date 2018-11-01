import { getTypeByName } from "type";
/** name, hp, attack, defense, sp.att, sp.def, speed, types, moveSet */
import table from "pokemon.json";
import multiView from "multiView";

export const getPokemonById = (function() {
	const pokemonProxyHandler = {
		get(target, key) {
			switch (key) {
				case "name": return target[0];
				case "hp": return target[1];
				case "attack": return target[2];
				case "defense": return target[3];
				case "specialAttack": return target[4];
				case "specialDefense": return target[5];
				case "speed": return target[6];
				case "types": return target[7].map(typeName => getTypeByName(typeName));
				case "moveSet": return target[8]; // TODO
				default: return Reflect.get(...arguments);
			}
		},
	};
	return id => new Proxy(table[id], pokemonProxyHandler);
})();

export function getPokemonByName(name) {
	for (let i = 0, length = table.length; i < length; ++i) {
		if (table[i][0] === name) return getPokemonById(i);
	}
	throw new Error("Cannot find pokemon with specified name.");
};

/**
 * Returns the total amount of experience required for the next level.
 * @param level The current level.
 * @return The amount of experience required for the next level.
 */
export const getTotalExpForLevel = level => 4 * level ** 3 / 5 | 0;

/** An instance of a pokemon. */
export default class Pokemon {
	constructor(species, level, moves) {
		this.species = typeof species === "string" ? getPokemonByName(species)
			: typeof species === "number" ? getPokemonById(species) : species;
		this.name = this.species.name; // Allow renaming pokemon
		this.level = level;
		this.exp = 0;
		this.hp = this.calculateStats().hp;
		this.moves = moves.map(move => multiView({ pp: move.pp }, move));

		if (new.target === Pokemon) Object.preventExtensions(this);
	}

	// TODO add JSON de/serialization

	/**
	 * Calculates the individual base stats of the pokemon.
	 * Based on level, returns hp; attack; defense; sp. attack; sp. defense and speed.
	 * Does not care about IVs nor EVs.
	 * @return An object with the stats.
	 */
	calculateStats() {
		const stats = this.species,
			getStat = base => 2 * base * this.level / 100 + 5 | 0;
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
