/** name, hp, attack, defense, sp.att, sp.def, speed, types, moveSet */
import pokemon from "pokemon.json";
import { getTypeByName } from "type";
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
	return id => new Proxy(pokemon[id], pokemonProxyHandler);
})();

export function getPokemonByName(name) {
	for (let i = 0, length = pokemon.length; i < length; ++i) {
		if (pokemon[i][0] === name) return getPokemonById(i);
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
		this.name = this.species.name;
		this.level = level;
		this.hp = calculateStats(this).hp;
		this.moves = moves.map(move => {
			let ppObj = { pp: move.pp };
			return multiView(ppObj, move);
		});
		this.exp = 0;
	}

	// TODO add JSON de/serialization
}

/** Does not care about IVs and EVs. */
export const calculateStats = function(pokemon) {
	const stats = pokemon.species;
	const getStat = base => 2 * base * pokemon.level / 100 + 5 | 0;
	return {
		hp: 2 * stats.hp * pokemon.level / 100 + pokemon.level + 10 | 0,
		attack: getStat(stats.attack),
		defense: getStat(stats.defense),
		specialAttack: getStat(stats.specialAttack),
		specialDefense: getStat(stats.specialDefense),
		speed: getStat(stats.speed),
	};
};
