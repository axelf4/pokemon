import Direction, {DirectionComponent} from "direction";
var PushTrigger = require("PushTrigger.js");
import save from "savegame";
import {wait} from "../utils";

import Position from "Position";
import Size from "Size";
import Interactable from "Interactable";

export default function(game, loader) {
	let em = game.em;
	loader.load("assets/professor-house.tmx").then(map => {
		game.setMap(map, ["Tile Layer 1", "Tile Layer 2", "Tile Layer 3"], ["Foreground"]);
	});

	game.addPushTrigger(new PushTrigger.TilePushTrigger(() => {
		(async () => {
			if (save.hasGottenPokemon) {
				await game.showDialog("Why didn't you just take all my Pokemon. Stupid idiot...");
			}
			game.warp(16, 15, "ballettown.js");
		})();
		return true;
	}, 5, 12));

	let professor = em.createEntity()
		.addComponent(Position, 5, 5)
		.addComponent(DirectionComponent, Direction.Down)
		.addComponent(Interactable, async game => {
			game.lock();
			game.faceEachOther(professor, game.player);
			if (!save.hasGottenPokemon) {
				await game.showDialog("Hello, I am your new neighbor, the Pokemon professor Beech.");
				await game.showDialog("Pokemon are beautiful creatures that live alongside humans. Some use Pokemon to play while some only see them as tools for their own benefit.");
				await game.showDialog("I have devoted my life to researching diffent Pokemon's mating behaviours. Most of my work is conducted here in my laboratory.");
				await game.showDialog("Funnily enough, I have three especially horny buggers here with me today for a special experi...");
				await wait(700);
				await game.showDialog("Huh, you want to steal one? What, you high or something?");
				var selected = await game.multichoice("Which Pokemon will you steal?", ["FIRE, Laserturken", "GRASS, dat boi", "WATER, Dolan"]);
				if (selected === -1) await game.showDialog("You didn't steal any Pokemon...");
				else {
					if (selected === 0) {
						await game.showDialog("You received Laserturken.");
					} else if (selected === 1) {
						await game.showDialog("You received dat boi.");
					} else if (selected === 2) {
						await game.showDialog("You received Dolan.");
					}

					save.hasGottenPokemon = true;
				}
			} else {
				await game.showDialog("It's fine. I did some bad things in my youth as well. Let's just try to be friends.");
			}
			game.release();
		});
	game.loadCharacterSprite(professor, "assets/sprites/girlSprite.png");

	let sign = em.createEntity()
		.addComponent(Position, 8, 1)
		.addComponent(Interactable, async game => {
			game.lock();
			await game.showDialog("Half a dozen tabs of porn are opened. Incognito mode is disabled. That animal!");
			game.release();
		});

	let tank = em.createEntity()
		.addComponent(Position, 0, 10)
		.addComponent(Size, 2, 1)
		.addComponent(Interactable, async game => {
			game.lock();
			await game.showDialog("The label reads \"Sliquid Silver Silicone Intimate Lubricant\".");
			game.release();
		});

	let bed = em.createEntity()
		.addComponent(Position, 14, 5)
		.addComponent(Size, 2, 2)
		.addComponent(Interactable, async game => {
			game.lock();
			await game.showDialog("There is something sticky on the sheets...");
			game.release();
		});
}
