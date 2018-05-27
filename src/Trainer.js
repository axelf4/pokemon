export default class Trainer {
	constructor(name, pokemons) {
		this.name = name;
		this.pokemons = pokemons;
	}

	getName() {
		return this.name;
	}

	getPokemons() {
		return this.pokemons;
	}

	canEscapeFrom() {
		return true;
	}

	getFirstPokemon() {
		if (this.pokemons.length < 1) throw new Error("The trainer does not have any pokemons.");
		return this.pokemons[0];
	}

	getPrimaryPokemon() {
		if (this.pokemons.length < 1) throw new Error("The trainer does not have any pokemons.");
		return this.pokemons[0];
	}
}
