var Trainer = function(name, pokemons) {
	this.name = name;
	this.pokemons = pokemons;
};

Trainer.prototype.getName = function() {
	return this.name;
};

Trainer.prototype.getPokemons = function() {
	return this.pokemons;
};

Trainer.prototype.canEscapeFrom = function() {
	return false;
};

Trainer.prototype.getPrimaryPokemon = function() {
	if (this.pokemons.length < 1) throw new Error("The trainer does not have any pokemons.");
	return this.pokemons[0];
};

Trainer.prototype.getNameOrYou = function() {
	return this.getName();
};

module.exports = Trainer;
