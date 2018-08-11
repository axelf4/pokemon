export default class Trainer {
	constructor(name, pokemon, isWild = false) {
		this.name = name;
		this.pokemon = pokemon;
		this.isWild = isWild;
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
}
