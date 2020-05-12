import Pokemon from "./pokemon";
import Item from "./item";

export default class Trainer {
	name: string;
	pokemons: Pokemon[];
	isWild: boolean;
	items: Item[];

	constructor(name: string, pokemons: Pokemon[], isWild = false) {
		this.name = name;
		this.pokemons = pokemons;
		this.isWild = isWild;
		this.items = [];
	}

	getName() {
		return this.name;
	}

	canEscapeFrom() {
		return this.isWild;
	}

	/**
	 * Returns the pokemon that is first sent out when initiating a battle.
	 *
	 * @return The pokemon or undefined if no such pokemon exists.
	 */
	getPrimaryPokemon() {
		return this.pokemons.find(p => p.hp > 0);
	}

	/**
	 * Returns whether this trainer has any remaining healthy pokemon.
	 */
	hasUsablePokemon() {
		return !!this.getPrimaryPokemon();
	}
}
