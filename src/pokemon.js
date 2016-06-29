exports.createPokemon = function(name, moves, hp, speed, attack, defense, level) {
	return {
		name: name,
		moves: moves,
		maxHp: hp,
		hp: hp,
		speed: speed,
		attack: attack,
		defense: defense,
		type1: null,
		type2: null,
		level: level
	}
};

exports.getName = function(pokemon) {
	return pokemon.name;
};

exports.getMoves = function(pokemon) {
	return pokemon.moves;
};

exports.getHP = function(pokemon) {
	return pokemon.hp;
};

exports.getSpeed = function(pokemon) {
	return pokemon.speed;
};

exports.getAttack = function(pokemon) {
	return pokemon.attack;
};

exports.getDefense = function(pokemon) {
	return pokemon.defense;
};

exports.getLevel = function(pokemon) {
	return pokemon.level;
};
