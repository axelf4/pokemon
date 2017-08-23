import State from "State";
var Panel = require("Panel.js");
var Dialog = require("Dialog.js");
var align = require("align.js");
var texture = require("texture.js");
var Image = require("Image.js");
var Select = require("Select.js");
var promiseWhile = require("promiseWhile.js");
var thread = require("thread.js");
import * as stateManager from "stateManager";
var pokemon = require("pokemon.js");
var move = require("move.js");
var Widget = require("Widget");
var measureSpec = require("measureSpec");

// Note: these are numbered in order of priority
var ACTION_TYPE_ATTACK = 0;
var ACTION_TYPE_SWITCH_POKEMON = 1;
var ACTION_TYPE_RUN = 2;
// var ACTION_TYPE_USE_ITEM = 2;

var Action = function(type, pokemon, isPlayer) {
	this.type = type;
	this.pokemon = pokemon;
	this.isPlayer = isPlayer;

	// Action specific
	this.move = null;
	this.nextPokemon = null;
};

Action.prototype.getType = function() {
	return this.type;
};

/**
 * @see http://bulbapedia.bulbagarden.net/wiki/Escape
 */
var canFlee = function(speed, enemySpeed, escapeAttempts) {
	return Math.random() * 255 < (speed * 128 / (enemySpeed || 1) + 30 * escapeAttempts) % 256;
};

var BattleState = function(loader, nextState, playerTrainer, enemyTrainer) {
	State.call(this);
	this.nextState = nextState;
	var playerPokemon = playerTrainer.getPrimaryPokemon();
	var enemyPokemon = enemyTrainer.getPrimaryPokemon();

	var widget = this.widget = new Panel();
	widget.direction = Panel.DIRECTION_COLUMN;

	var view = new Panel();
	view.direction = Panel.DIRECTION_COLUMN;
	view.style.align = align.STRETCH;
	view.flex = 1;
	widget.addWidget(view);

	// TODO add healthbars
	var dig = new Dialog("Slowpoke vs Snoop Dogg");
	dig.flex = 1;
	dig.style.align = align.STRETCH;
	view.addWidget(dig);

	var slowpokeImage = new Image(null);
	slowpokeImage.style.align = align.CENTER;
	view.addWidget(slowpokeImage);
	loader.loadTextureRegion("assets/pokemon/Slowpoke.png").then(region => {
		slowpokeImage.setRegion(region);
	});

	var info = new Panel();
	info.direction = Panel.DIRECTION_ROW;
	info.style.height = 100;
	widget.addWidget(info);

	var showDialog = function(text) {
		return new Promise(function(resolve, reject) {
			var dialog = new Dialog(text, resolve);
			dialog.style.align = align.STRETCH;
			dialog.flex = 1;
			info.addWidget(dialog);
			dialog.requestFocus();
		});
	};

	thread(function*() {
		var battling = true;

		yield showDialog(enemyTrainer.getName() + " wants to fight!\n" + enemyTrainer.getName() + " sent out " + pokemon.getName(enemyPokemon) + "!");
		yield showDialog("Go! " + pokemon.getName(playerPokemon) + "!");

		var escapeAttempts = 0;

		while (battling) {
			var playerAction = null;
			while (!playerAction) {
				var selected = yield new Promise(function(resolve, reject) {
					var dialog = new Dialog("What will " + pokemon.getName(playerPokemon) + " do?");
					dialog.style.align = align.STRETCH;
					dialog.flex = 1;
					info.addWidget(dialog);
					var select = new Select(["FIGTH", "BAG", "POKéMON", "RUN"], 2, resolve);
					select.style.align = align.STRETCH;
					info.addWidget(select);
					select.requestFocus();
				});
				info.removeAllWidgets();
				switch (selected) {
					case -1: break; // Shift was pressed
					case 0: // Fight
							 var moveId = yield new Promise(function(resolve, reject) {
								 var moveNames = pokemon.getMoves(playerPokemon).map(value => move.getName(value));
								 var select = new Select(moveNames, 2, resolve);
								 select.style.align = align.STRETCH;
								 select.flex = 1;
								 info.addWidget(select);
								 select.requestFocus();
							 });
							 info.removeAllWidgets();
							 if (moveId !== -1) {
								 var selectedMove = pokemon.getMoves(playerPokemon)[moveId];
								 playerAction = new Action(ACTION_TYPE_ATTACK, playerPokemon, true);
								 playerAction.move = selectedMove;
							 }
							 break;
					case 1: // Bag
							 yield showDialog("There's a time and place for everything, but not now...");
							 break;
					case 2: // Pokemon
							 yield showDialog("Cannot switch pokemons yet.");
							 break;
					case 3: // Run
							 // TODO can't escape against trainers
							 playerAction = new Action(ACTION_TYPE_RUN, playerPokemon, true);
							 break;
					default:
							 throw new Error("Invalid selected value.");
				}
			}

			// TODO select enemy action
			var enemyAction = new Action(ACTION_TYPE_ATTACK, enemyPokemon, false);
			enemyAction.move = pokemon.getMoves(enemyPokemon)[0];

			var queue = [playerAction, enemyAction].sort((a, b) => {
				var aType = a.getType(), bType = b.getType();
				if (aType === ACTION_TYPE_ATTACK && bType === ACTION_TYPE_ATTACK) {
					if (move.getPriority(a.move) !== move.getPriority(b.move)) {
						return move.getPriority(b.move) - move.getPriority(a.move);
					}
					return pokemon.getSpeed(b.pokemon) - pokemon.getSpeed(a.pokemon);
				}
				return bType - aType;
			});

			for (var i = 0, length = queue.length; i < length && battling; ++i) {
				var action = queue[i];

				// Generic variables for the user/target of an attack
				var attacker, defender;
				if (action.isPlayer) {
					attacker = playerPokemon;
					defender = enemyPokemon;
				} else {
					attacker = enemyPokemon;
					defender = playerPokemon;
				}

				switch (action.getType()) {
					case ACTION_TYPE_RUN:
						if (attacker !== playerPokemon) throw new Error("Fleeing to yet implemented for enemy pokemons.");
						if (canFlee(pokemon.getSpeed(playerPokemon), pokemon.getSpeed(enemyPokemon), ++escapeAttempts)) {
							yield showDialog("Got away safely!");
							battling = false;
						} else {
							yield showDialog("Can't escape! Don't try to run away you pussy.");
						}
						break;
					case ACTION_TYPE_ATTACK:
						yield showDialog(pokemon.getName(attacker) + " used " + move.getName(action.move) + "!");
						if (Math.random() * 99 >= move.getAccuracy(action.move)) {
							yield showDialog("But it missed.");
						} else {
							// TODO calculate damage and effects
							// It's not very effective...
							yield showDialog("It's super effective!");
							var L = pokemon.getLevel(attacker), P = move.getPower(action.move), A = pokemon.getAttack(attacker), D = pokemon.getDefense(defender);
							var damage = Math.floor(Math.floor(Math.floor(2 * L / 5 + 2) * A * P / D) / 50) + 2;
							yield showDialog("It dealt " + damage + " damage!");
							defender.hp = Math.max(0, defender.hp - damage);
						}
						break;
					default:
						throw new Error("Invalid action.");
				}

				console.log("defender hp: " + defender.hp + " isDefenderPlayer: " + !action.isPlayer);

				// Check both parties' health since a move can kill it's user
				if (pokemon.getHP(playerPokemon) <= 0) {
					yield showDialog(pokemon.getName(playerPokemon) + " fainted!");
					yield showDialog(playerTrainer.getName() + " is out of usable POKéMON!");
					yield showDialog(playerTrainer.getName() + " blacked out!");
					yield showDialog("Game over.");
					window.close();
					battling = false;
				}
				if (pokemon.getHP(enemyPokemon) <= 0) {
					yield showDialog("Foe " + pokemon.getName(enemyPokemon) + " fainted!");
					battling = false;
				}
			}
		}

		stateManager.setState(nextState);
	});
};
BattleState.prototype = Object.create(State.prototype);
BattleState.prototype.constructor = BattleState;


BattleState.prototype.draw = function(batch, dt, time) {
	if (this.widget && this.widget.flags & Widget.FLAG_LAYOUT_REQUIRED) {
		var widthMeasureSpec = measureSpec.make(this.width, measureSpec.EXACTLY);
		var heightMeasureSpec = measureSpec.make(this.height, measureSpec.EXACTLY);

		this.widget.layout(widthMeasureSpec, heightMeasureSpec);
	}

	batch.begin();
	this.widget.draw(batch, dt, time);
	batch.end();
}

module.exports = BattleState;
