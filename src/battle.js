import { calculateStats } from "pokemon";
import multiView from "multiView";
import { damageNone, damagePhysical, damageSpecial } from "move";

/**
 * Type effectiveness for [attacking move type][defending type].
 * Super effective is represented by two, not very effective by a half
 * and not effective by zero.
 */
const typeMultipliers = [
	[1, 1, 1, 1, 1, .5, 1, 0, .5, 1, 1, 1, 1, 1, 1, 1, 1], // Normal
	[2, 1, .5, .5, 1, 2, .5, 0, 2, 1, 1, 1, 1, .5, 2, 1, 2], // Fight
	[1, 2, 1, 1, 1, .5, 2, 1, .5, 1, 1, 2, .5, 1, 1, 1, 1], // Flying
	[1, 1, 1, .5, .5, .5, 1, .5, 0, 1, 1, 2, 1, 1, 1, 1, 1], // Poison
	[1, 1, 0, 2, 1, 2, .5, 1, 2, 2, 1, .5, 2, 1, 1, 1, 1], // Ground
	[1, .5, 2, 1, .5, 1, 2, 1, .5, 2, 1, 1, 1, 1, 2, 1, 1], // Rock
	[1, .5, .5, .5, 1, 1, 1, .5, .5, .5, 1, 2, 1, 2, 1, 1, 2], // Bug
	[0, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, .5], // Ghost
	[1, 1, 1, 1, 1, 2, 1, 1, .5, .5, .5, 1, .5, 1, 2, 1, 1], // Steel
	[1, 1, 1, 1, 1, .5, 2, 1, 2, .5, .5, 2, 1, 1, 2, .5, 1], // Fire
	[1, 1, 1, 1, 2, 2, 1, 1, 1, 2, .5, .5, 1, 1, 1, .5, 1], // Water
	[1, 1, .5, .5, 2, 2, .5, 1, .5, .5, 2, .5, 1, 1, 1, .5, 1], // Grass
	[1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 2, .5, .5, 1, 1, .5, 1], // Electr
	[1, 2, 1, 2, 1, 1, 1, 1, .5, 1, 1, 1, 1, .5, 1, 1, 0], // Psychc
	[1, 1, 2, 1, 2, 1, 1, 1, .5, .5, .5, 2, 1, 1, .5, 2, 1], // Ice
	[1, 1, 1, 1, 1, 1, 1, 1, .5, 1, 1, 1, 1, 1, 1, 2, 1], // Dragon
	[1, .5, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, .5], // Dark
];

const calculateDamage = function(attacker, defender, move) {
	// http://bulbapedia.bulbagarden.net/wiki/Damage_modification#Damage_formula
	let attack, defense;
	switch (move.damageClass) {
		case damagePhysical:
			attack = attacker.attack;
			defense = defender.defense;
			break;
		case damageSpecial:
			attack = attacker.specialAttack;
			defense = defender.specialDefense;
			break;
		case damageNone:
			return {
				damage: 0,
				typeEffectiveness: 1
			};
		default:
			throw new Error();
	}

	const isCrit = Math.random() < attacker.speed / 0x200;
	const typeEffectiveness = defender.species.types.reduce((acc, type) => acc * typeMultipliers[move.type][type], 1);

	let stab = 1;
	for (let type of attacker.species.types) {
		if (type === move.type) {
			stab = 1.5;
			break;
		}
	}

	const multipliers = stab * typeEffectiveness * (isCrit ? 2 : 1);

	return {
		damage: ((2 * attacker.level + 10) / 250
				 * (attack / defense) * move.power + 2)
			* (0.15 * Math.random() + 0.88) * multipliers | 0,
		typeEffectiveness
	};
};

/**
 * Returns whether a flee attempt was successful.
 * @see http://bulbapedia.bulbagarden.net/wiki/Escape
 */
const canFlee = (speed, enemySpeed, escapeAttempts) =>
	Math.random() * 255 < (speed * 128 / (enemySpeed || 1) + 30 * escapeAttempts) % 256;

const isMiss = move => 100 * Math.random() >= move.accuracy;

export const battleEventText = 0x0,
	   battleEventQueryAction = 0x1,
	   battleEventDeployPokemon = 0x2,
	   battleEventUseMove = 0x4,
	   battleEventSetHealth = 0x8,
	   battleEventFaint = 0x7;

// These are numbered in ascending order of priority
export const actionAttack = 0x0,
	   actionSwitchPokemon = 0x1,
	   actionRun = 0x2,
	   actionUseItem = 0x3;

/**
 * @param player The player trainer.
 * @param enemy The enemy trainer.
 */
export default function* battle(player, enemy) {
	const playerPokemon = multiView(player.getPrimaryPokemon(),
			calculateStats(player.getPrimaryPokemon()));
	const enemyPokemon = multiView(enemy.getPrimaryPokemon(),
			calculateStats(enemy.getPrimaryPokemon()));

	let escapeAttempts = 0;

	yield { type: battleEventText, text: enemy.getName() + " wants to fight!\n" + enemy.getName() + " sent out " + enemyPokemon.name + "!" };
	yield { type: battleEventText, text: "Go! " + playerPokemon.name + "!" };

	battleLoop:
	for (;;) {
		const playerAction = yield { type: battleEventQueryAction, pokemon: playerPokemon },
			enemyAction = { type: actionAttack, move: enemyPokemon.moves[0], isPlayer: false }; // TODO add AI

		const queue = [
			{isPlayer: true, pokemon: playerPokemon, ...playerAction},
			{isPlayer: false, pokemon: enemyPokemon, ...enemyAction}
		].sort((a, b) =>
				a.type === actionAttack && b.type === actionAttack
				? b.move.priority - a.move.priority || b.pokemon.speed - a.pokemon.speed
				: b.type - a.type);
		for (let action of queue) {
			let attacker, defender;
			if (action.isPlayer) {
				attacker = playerPokemon;
				defender = enemyPokemon;
			} else {
				attacker = enemyPokemon;
				defender = playerPokemon;
			}

			switch (action.type) {
				case actionRun:
					if (!action.isPlayer) throw new Error("Enemy fleeing not yet implemented.");
					if (canFlee(playerPokemon.speed, enemyPokemon.speed, ++escapeAttempts)) {
						yield { type: battleEventText, text: "Got away safely!" };
						break battleLoop;
					} else {
						yield { type: battleEventText, text: "Can't escape!" };
					}
					break;
				case actionAttack:
					--action.move.pp; // Deplete PP
					yield { type: battleEventText, text: `${attacker.name} used ${action.move.name}!` };

					if (isMiss(action.move)) {
						yield { type: battleEventText, text: "But it missed." };
					} else {
						const { damage, typeEffectiveness } = calculateDamage(attacker, defender, action.move);
						if (typeEffectiveness > 1)
							yield { type: battleEventText, text: "It's super effective!" };
						else if (typeEffectiveness === 0)
							yield { type: battleEventText, text: "It's not effective..." };
						else if (typeEffectiveness < 1)
							yield { type: battleEventText, text: "It's not very effective..." };

						defender.hp = Math.max(0, defender.hp - damage);
						yield { type: battleEventUseMove, move: action.move, isPlayer: action.isPlayer };

						yield { type: battleEventSetHealth, isPlayer: action.isPlayer, percentage: defender.hp / defender[1].hp };
						// Debug
						yield { type: battleEventText, text: "It dealt " + damage + " damage.\nFoe has " + defender.hp + " remaining." };
					}

					// Check both parties' health since a move can kill it's user
					if (playerPokemon.hp <= 0) {
						yield { type: battleEventFaint, isPlayer: true };
						yield { type: battleEventText, text: playerPokemon.name + " fainted!"};
						yield { type: battleEventText, text: player.name + " is out of usable pokemon!"};
						yield { type: battleEventText, text: player.name + " blacked out!"};
						break battleLoop;
					}
					if (enemyPokemon.hp <= 0) {
						yield { type: battleEventFaint, isPlayer: false };
						yield { type: battleEventText, text: "Foe " + enemyPokemon.name + " fainted!"};
						break battleLoop;
					}

					break;
				default:
					throw new Error("Invalid action.");
			}
		}
	}
}
