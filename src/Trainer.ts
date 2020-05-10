import Item from "./item";

type Pokemon = any;

export default class Trainer {
	name: string;
	pokemon: Pokemon[];
	isWild: boolean;
	items: Item[];

	constructor(name: string, pokemon: Pokemon[], isWild = false) {
		this.name = name;
		this.pokemon = pokemon;
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
		return this.pokemon.find(p => p.hp > 0);
	}

	/**
	 * Returns whether this trainer has any remaining healthy pokemon.
	 */
	hasUsablePokemon() {
		return !!this.getPrimaryPokemon();
	}
}
