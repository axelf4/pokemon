import Pokemon, {Move, MoveInstance, DamageCategory, Stats} from "./pokemon";
import Trainer from "./Trainer";
import clamp from "./clamp";

/**
 * Type effectiveness for <code>[attacking move type][defending type]</code>.
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
] as const;

type StatStage = -6 | -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6;

function clampStatStage(s: number): StatStage {
	return clamp(s, -6, 6) as StatStage;
}

type StatStages = { [S in keyof Omit<Stats, 'hp'> | 'accuracy' | 'evasion']: StatStage };

/**
 * Returns the multiplier for calculating the effective stat given the stat stage.
 *
 * Modelled after gen 2+ games except squared.
 *
 * @param s The current stat stage.
 * @return The multiplier.
 * @see https://www.dragonflycave.com/mechanics/stat-stages
 */
const statStageMultiplier = (s: StatStage) => (Math.max(2, 2 + s) / Math.max(2, 2 - s))**2;

const defaultStatStages: StatStages = {
	attack: 0, defense: 0, specialAttack: 0, specialDefense: 0,
	speed: 0, accuracy: 0, evasion: 0,
} as const;

/** A player/enemy battler that may have a pokemon in battle. */
class Battler {
	private active?: {pokemon: Pokemon, statStages: StatStages};

	constructor(readonly trainer: Trainer, readonly isPlayer: boolean) {}

	/**
	 * Makes this battler switch to the specified pokemon.
	 *
	 * Returns a battle event for this action.
	 */
	sendOut(newPokemon: Pokemon): BattleEvent {
		const oldPokemon = this.active?.pokemon;
		// Reset stat stages and volatile statuses
		this.active = {pokemon: newPokemon, statStages: {...defaultStatStages}};
		return {
			type: "sendOut", isPlayer: this.isPlayer, pokemon: newPokemon,
			oldPokemon: oldPokemon && !oldPokemon.isFainted() ? oldPokemon : null,
		};
	}

	get pokemon() {
		return this.active!.pokemon;
	}

	get statStages() {
		return this.active!.statStages;
	}

	calculateStats() {
		let {pokemon, statStages} = this.active!;
		let stats = pokemon.calculateStats();
		for (let key of Object.keys(stats).filter(k => k !== "hp"))
			stats[key as keyof Stats] *= statStageMultiplier(statStages[key as keyof StatStages]);
		return stats;
	}
}

/** Returns whether usage of the specified move missed. */
function isMiss(attacker: Battler, move: Move): boolean {
	return move.accuracy
		* statStageMultiplier(clampStatStage(attacker.statStages.accuracy - attacker.statStages.evasion))
		< 100 * Math.random();
}

/**
 * Calculates the damage of an attack.
 *
 * @param attacker The attacker battler.
 * @param defender The defender battler.
 * @param move The move in question.
 * @see http://bulbapedia.bulbagarden.net/wiki/Damage_modification#Damage_formula
 */
function calculateDamage(attacker: Battler, defender: Battler, move: Move) {
	const attackerStats = attacker.calculateStats(),
		defenderStats = defender.calculateStats();
	let attack, defense;
	switch (move.damageCategory) {
		case DamageCategory.Physical:
			attack = attackerStats.attack;
			defense = defenderStats.defense;
			break;
		case DamageCategory.Special:
			attack = attackerStats.specialAttack;
			defense = defenderStats.specialDefense;
			break;
		case DamageCategory.Status:
			return { damage: 0, typeEffectiveness: 1, crit: false };
	}

	const crit = Math.random() < attackerStats.speed / 0x200;
	const typeEffectiveness = defender.pokemon.species.types.reduce((acc, type) => acc * typeMultipliers[move.type][type], 1);
	const stab = attacker.pokemon.species.types.some(type => type === move.type) ? 1.5 : 1;
	const multipliers = stab * typeEffectiveness * (crit ? 2 : 1);

	return {
		damage: ((2 * attacker.pokemon.level + 10) / 250 * (attack / defense) * move.power + 2) * (0.15 * Math.random() + 0.88) * multipliers | 0,
		typeEffectiveness, crit,
	};
}

/**
 * Returns whether a flee attempt was successful.
 * @see http://bulbapedia.bulbagarden.net/wiki/Escape
 */
function canFlee(speed: number, enemySpeed: number, escapeAttempts: number): boolean {
	return 255 * Math.random() < (128 * speed / (enemySpeed || 1) + 30 * escapeAttempts) % 256;
}

/** Types of events yielded from the battle generator function. */
type BattleEvent =
	| { type: "msgbox"; text: string, time?: number }
	| { type: "queryAction"; pokemon: Pokemon }
	| { type: "sendOut"; isPlayer: boolean, pokemon: Pokemon, oldPokemon: Pokemon | null }
	| { type: "useMove"; pokemon: Pokemon, move: Move, miss: boolean, isPlayer: boolean }
	| { type: "setHealth"; percentage: number, isPlayer: boolean }
	| { type: "faint"; pokemon: Pokemon, isPlayer: true, promptForNext: boolean }
	| { type: "faint"; pokemon: Pokemon, isPlayer: false }
	| { type: "gainExp", pokemon: Pokemon, prevExp: number, newExp: number };

/** Possible actions numbered in ascending order of priority. */
export enum ActionType { Attack, SwitchPokemon, Run, UseItem }

type Action =
	| { type: ActionType.Attack, move: MoveInstance }
	| { type: ActionType.SwitchPokemon, pokemonIndex: number }
	| { type: ActionType.Run };

/**
 * Enumeration of weather types.
 *
 * @see https://bulbapedia.bulbagarden.net/wiki/Weather#Types_of_weather_and_effects
 */
enum WeatherType {
	/** The default weather type. */
	ClearSkies,
		/** Makes all pokemon immune to freezing. */
		HarshSunlight, Rain, Sandstorm, Hail
}

/**
 * Returns the experience yield from defeating a enemy pokemon.
 * @param isWild Whether the fainted Pokémon is wild
 * @param fainted The fainted Pokémon.
 * @param participators The Pokémon that participated in the battle from the victorious party.
 * @return The experience gained for each participant.
 *
 * @see https://bulbapedia.bulbagarden.net/wiki/Experience#Gain_formula
 */
function expGain(isWild: boolean, fainted: Pokemon, participators: Pokemon[]): number {
	return (isWild ? 1 : 1.5) * 125 * fainted.level
		/ (7 * participators.filter(p => !p.isFainted()).length) | 0;
}

/**
 * Simulates a battle.
 *
 * @param playerTrainer The player trainer.
 * @param enemyTrainer The enemy trainer.
 */
export default function* battle(playerTrainer: Trainer, enemyTrainer: Trainer): Generator<BattleEvent, void, Action | undefined> {
	const player = new Battler(playerTrainer, true), enemy = new Battler(enemyTrainer, false);
	yield enemy.sendOut(enemy.trainer.getPrimaryPokemon()!);
	yield player.sendOut(player.trainer.getPrimaryPokemon()!);

	let escapeAttempts = 0;
	battleLoop:
	for (;;) {
		const playerAction = (yield { type: "queryAction", pokemon: player.pokemon })!,
			enemyAction: Action = { type: ActionType.Attack, move: enemy.pokemon.moves[0]! }; // TODO add AI

		const queue = [{battler: player, ...playerAction}, {battler: enemy, ...enemyAction}].sort((a, b) =>
			a.type === ActionType.Attack && b.type === ActionType.Attack
			? b.move.type.priority - a.move.type.priority
			|| b.battler.calculateStats().speed - a.battler.calculateStats().speed
			: b.type - a.type);
		actionLoop:
		for (let action of queue) {
			const battler = action.battler, {trainer, isPlayer} = battler;
			const [attacker, defender] = isPlayer ? [player, enemy] : [enemy, player];

			switch (action.type) {
				case ActionType.Run:
					if (!isPlayer) throw new Error("Enemy fleeing not yet implemented.");
					if (canFlee(player.calculateStats().speed, enemy.calculateStats().speed, ++escapeAttempts)) {
						yield { type: "msgbox", text: "Got away safely!" };
						break battleLoop;
					} else {
						yield { type: "msgbox", text: "Can't escape!" };
					}
					break;

				case ActionType.Attack:
					--action.move.pp; // Deplete PP
					const move = action.move.type;
					const miss = isMiss(attacker, move);
					yield { type: "useMove", pokemon: attacker.pokemon, move, isPlayer, miss };

					if (!miss) {
						let { damage, typeEffectiveness, crit } = calculateDamage(attacker, defender, move);
						defender.pokemon.hp = Math.max(0, defender.pokemon.hp - damage);
						yield { type: "setHealth", isPlayer: !isPlayer, percentage: defender.pokemon.getHpPercentage() };
						if (crit) yield { type: "msgbox", text: "A critical hit!", time: 1500 }

						let effectivenessNotice;
						switch (typeEffectiveness) {
							case 0.5: effectivenessNotice = "It's not very effective!"; break;
							case 0: effectivenessNotice = "It's not effective..."; break;
							case 2: effectivenessNotice = "It's super effective..."; break;
						}
						if (effectivenessNotice) yield { type: "msgbox", text: effectivenessNotice, time: 1500 };

						yield { type: "msgbox", text: `It dealt ${damage} damage.\nFoe has ${defender.pokemon.hp} remaining.` };
					}

					// Check both parties' health since a move can kill it's user
					if (player.pokemon.hp <= 0) {
						const promptForNext = player.trainer.hasUsablePokemon();
						const nextIndex = yield { type: "faint",
							isPlayer: true,
							pokemon: player.pokemon,
							promptForNext,
						};

						if (promptForNext) {
							if (!nextIndex) throw new Error("Should provide switch action");
							if (nextIndex.type !== ActionType.SwitchPokemon) throw new Error();
							let newPokemon = player.trainer.pokemons[nextIndex.pokemonIndex];
							yield player.sendOut(newPokemon);
						} else {
							yield { type: "msgbox", text: player.trainer.name + " is out of usable pokemon!"};
							yield { type: "msgbox", text: player.trainer.name + " blacked out!"};
							break battleLoop;
						}
						break actionLoop;
					}
					if (enemy.pokemon.hp <= 0) {
						// TODO check if enemy still has healthy pokemon
						yield { type: "faint", isPlayer: false, pokemon: enemy.pokemon };

						// TODO Handle multiple participants
						const gainedExp = expGain(enemy.trainer.isWild, enemy.pokemon, [player.pokemon]);
						let prevExp = player.pokemon.exp;
						player.pokemon.exp += gainedExp;
						for (;;) {
							let totalForLevelUp = player.pokemon.getTotalExpForLevelUp();
							let newExp = Math.min(totalForLevelUp, player.pokemon.exp);
							yield { type: "gainExp", pokemon: player.pokemon, prevExp, newExp };
							if (player.pokemon.exp >= totalForLevelUp) {
								player.pokemon.exp -= totalForLevelUp;
								++player.pokemon.level;
								yield { type: "msgbox", text: `${player.pokemon.name} leveled up!` };
							} else {
								break;
							}
							prevExp = 0;
						}
						break battleLoop;
					}

					break;

				case ActionType.SwitchPokemon:
					let newPokemon = battler.trainer.pokemons[action.pokemonIndex];
					yield battler.sendOut(newPokemon);
					break;
			}
		}
	}
}
