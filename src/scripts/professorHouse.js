import {DirectionComponent, DOWN} from "direction";
var PushTrigger = require("PushTrigger.js");
import thread from "thread";
import save from "savegame";
import wait from "wait";

import Position from "Position";
import Size from "Size";
import Interactable from "Interactable";

export default function(game, loader) {
	let em = game.em;
	loader.loadMap("assets/professor-house.tmx").then(map => {
		game.setMap(map, ["Tile Layer 1", "Tile Layer 2", "Tile Layer 3"], ["Foreground"]);
	});

	// game.addPushTrigger(PushTrigger.createWarp(game, 5, 12, 16, 15, "ballettown.js"));
	game.addPushTrigger(new PushTrigger.TilePushTrigger(thread.bind(undefined, function*() {
		if (save.hasGottenPokemon) {
			yield game.showDialog("Why didn't you just take all my Pokemon. Stupid idiot...");
		}
		game.warp(16, 15, "ballettown.js");
		return true;
	}), 5, 12));

	let professor = em.createEntity()
		.addComponent(Position, 5, 5)
		.addComponent(DirectionComponent, DOWN)
		.addComponent(Interactable, thread.bind(undefined, function*(game) {
			game.lock();
			game.faceEachOther(professor, game.player);
			if (!save.hasGottenPokemon) {
				yield game.showDialog("Hello, I am your new neighbor, the Pokémon professor Clark.");
				yield game.showDialog("Pokémon are beautiful creatures that live alongside humans. Some use Pokémon to play while some only see them as tools for their own benefit.");
				yield game.showDialog("I have devoted my life to researching diffent Pokémon's mating behaviours. Most of my work is conducted here in my laboratory.");
				yield game.showDialog("Funnily enough, I have three especially horny buggers here with me today for a special experi...");
				yield wait(700);
				yield game.showDialog("Huh, you want to steal one? What, you high or something?");
				var selected = yield game.multichoice("Which Pokemon will you steal?", ["FIRE - Laserturken", "GRASS - dat boi", "WATER - Dolan"]);
				if (selected === -1) yield game.showDialog("You didn't steal any Pokémon...");
				else {
					if (selected === 0) {
						yield game.showDialog("You received Laserturken.");
					} else if (selected === 1) {
						yield game.showDialog("You received dat boi.");
					} else if (selected === 2) {
						yield game.showDialog("You received Dolan.");
					}

					save.hasGottenPokemon = true;
				}
			} else {
				yield game.showDialog("It's fine. I did some bad things in my youth as well. Let's just try to be friends.");
			}
			game.release();
		}));
	game.loadCharacterSprite(professor, "assets/girlSprite.png");

	let sign = em.createEntity()
		.addComponent(Position, 8, 1)
		.addComponent(Interactable, thread.bind(undefined, function*(game) {
			game.lock();
			yield game.showDialog("Half a dozen tabs of porn are opened. Incognito mode is disabled. That animal!");
			game.release();
		}));

	let tank = em.createEntity()
		.addComponent(Position, 0, 10)
		.addComponent(Size, 2, 1)
		.addComponent(Interactable, thread.bind(undefined, function*(game) {
			game.lock();
			yield game.showDialog("The label reads: \"Sliquid Silver Silicone Intimate Lubricant\".");
			game.release();
		}));

	let bed = em.createEntity()
		.addComponent(Position, 14, 5)
		.addComponent(Size, 2, 2)
		.addComponent(Interactable, thread.bind(undefined, function*(game) {
			game.lock();
			yield game.showDialog("There is something sticky on the sheets...");
			game.release();
		}));
}
