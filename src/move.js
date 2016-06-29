// MoveType
exports.Effect = function() {
};

exports.DamageEffect = function() {
};

exports.createMove = function(name, type, power, accuracy, speed) {
	return {
		name: name,
		type: type,
		power: power,
		accuracy: accuracy,
		speed: speed,
	};
};

exports.getName = function(move) {
	return move.name;
};

/**
 * Returns the base power of the move.
 */
exports.getPower = function(move) {
	return move.power;
};

exports.getAccuracy = function(move) {
	return move.accuracy;
};

exports.getPriority = function(move) {
	return 0; // TODO
};

exports.getSpeed = function(move) {
	return move.speed;
};

/**
 * Whether the power is multiplied by 50%.
 */
exports.isStabApplied = function(move, pokemon) {
	return pokemon.type1 === move.type || pokemon.type2 === move.type;
};

// Move definitions

exports.TACKLE = {
	name: "Tackle",
	power: 50,
	accuracy: 100,
	priority: 0,
};

exports.FLAMETHROWER = {
	name: "Flamethrower",
};

exports.HYDROPUMP = {
	name: "Hydro Pump",
};

exports.PURSUIT = {
	name: "Pursuit",
};
