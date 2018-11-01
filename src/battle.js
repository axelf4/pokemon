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

/**
 * Calculates damage of the attack.
 * @see http://bulbapedia.bulbagarden.net/wiki/Damage_modification#Damage_formula
 */
const calculateDamage = function(attacker, defender, move) {
	const attackerStats = attacker.calculateStats(),
		defenderStats = defender.calculateStats();
	let attack, defense;
	switch (move.damageClass) {
		case damagePhysical:
			attack = attackerStats.attack;
			defense = defenderStats.defense;
			break;
		case damageSpecial:
			attack = attackerStats.specialAttack;
			defense = defenderStats.specialDefense;
			break;
		case damageNone:
			return { damage: 0, typeEffectiveness: 1, crit: false };
		default:
			throw new Error();
	}

	const crit = Math.random() < attackerStats.speed / 0x200;
	const typeEffectiveness = defender.species.types.reduce((acc, type) => acc * typeMultipliers[move.type][type], 1);

	const stab = attacker.species.types.some(type => type === move.type) ? 1.5 : 1;
	const multipliers = stab * typeEffectiveness * (crit ? 2 : 1);

	return {
		damage: ((2 * attacker.level + 10) / 250
				 * (attack / defense) * move.power + 2)
			* (0.15 * Math.random() + 0.88) * multipliers | 0,
		typeEffectiveness,
		crit,
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
	   battleEventSendOut = 0x2,
	   battleEventUseMove = 0x4,
	   battleEventSetHealth = 0x8,
	   battleEventFaint = 0x7;

// These are numbered in ascending order of priority
export const actionAttack = 0x0,
	   actionSwitchPokemon = 0x1,
	   actionRun = 0x2,
	   actionUseItem = 0x3;

/**
 * Simulates a battle.
 * @param player The player trainer.
 * @param enemy The enemy trainer.
 */
export default function* battle(player, enemy) {
	let playerPokemon = player.getPrimaryPokemon(),
		enemyPokemon = enemy.getPrimaryPokemon();

	let escapeAttempts = 0;

	yield { type: battleEventText, text: `${enemy.getName()} wants to fight!` };
	yield { type: battleEventSendOut, isPlayer: false, pokemon: enemyPokemon };
	yield { type: battleEventSendOut, isPlayer: true, pokemon: playerPokemon };

	battleLoop:
	for (;;) {
		const playerAction = yield { type: battleEventQueryAction, pokemon: playerPokemon },
			enemyAction = { type: actionAttack, move: enemyPokemon.moves[0], isPlayer: false }; // TODO add AI

		const queue = [
			{isPlayer: true, pokemon: playerPokemon, ...playerAction},
			{isPlayer: false, pokemon: enemyPokemon, ...enemyAction}
		].sort((a, b) =>
				a.type === actionAttack && b.type === actionAttack
				? b.move.priority - a.move.priority || b.pokemon.calculateStats().speed - a.pokemon.calculateStats().speed
				: b.type - a.type);
		actionLoop:
		for (let action of queue) {
			const {isPlayer} = action;
			const [trainer, attacker, defender] = isPlayer ? [player, playerPokemon, enemyPokemon] : [enemy, enemyPokemon, playerPokemon];

			const getSendOutEvent = (isPlayer, pokemonIndex, switching) => {
				const oldPokemon = isPlayer ? playerPokemon : enemyPokemon;
				const pokemon = (isPlayer ? player : enemy).pokemon[pokemonIndex];
				if (isPlayer) playerPokemon = pokemon; else enemyPokemon = pokemon;
				return { type: battleEventSendOut, isPlayer, pokemon, oldPokemon, switching };
			};

			switch (action.type) {
				case actionRun:
					if (!isPlayer) throw new Error("Enemy fleeing not yet implemented.");
					if (canFlee(playerPokemon.calculateStats().speed, enemyPokemon.calculateStats().speed, ++escapeAttempts)) {
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
						const { damage, typeEffectiveness, crit } = calculateDamage(attacker, defender, action.move);
						if (crit) yield { type: battleEventText, text: "A critical hit!" }
						if (typeEffectiveness > 1)
							yield { type: battleEventText, text: "It's super effective!" };
						else if (typeEffectiveness === 0)
							yield { type: battleEventText, text: "It's not effective..." };
						else if (typeEffectiveness < 1)
							yield { type: battleEventText, text: "It's not very effective..." };

						defender.hp = Math.max(0, defender.hp - damage);
						yield { type: battleEventUseMove, move: action.move, isPlayer };

						yield { type: battleEventSetHealth, isPlayer: !action.isPlayer, percentage: defender.getHpPercentage() };
						yield { type: battleEventText, text: "It dealt " + damage + " damage.\nFoe has " + defender.hp + " remaining." };
					}

					// Check both parties' health since a move can kill it's user
					if (playerPokemon.hp <= 0) {
						const promptForNext = !!player.getPrimaryPokemon();
						const nextIndex = yield { type: battleEventFaint,
							isPlayer: true,
							pokemon: playerPokemon,
							promptForNext,
						};

						if (promptForNext && nextIndex) {
							yield getSendOutEvent(true, nextIndex, false);
						} else {
							yield { type: battleEventText, text: player.name + " is out of usable pokemon!"};
							yield { type: battleEventText, text: player.name + " blacked out!"};
							break battleLoop;
						}
						break actionLoop;
					}
					if (enemyPokemon.hp <= 0) {
						// TODO check if enemy still has healthy pokemon
						yield { type: battleEventFaint, isPlayer: false, pokemon: enemyPokemon };
						yield { type: battleEventText, text: "Foe " + enemyPokemon.name + " fainted!"};
						break battleLoop;
					}

					break;
				case actionSwitchPokemon:
					yield getSendOutEvent(isPlayer, action.pokemonIndex, true);
					break;
				default:
					throw new Error("Invalid action.");
			}
		}
	}
}
