var PushTrigger = require("PushTrigger.js");
import {DirectionComponent, UP} from "direction";
import thread from "thread";
import Trainer from "Trainer";
import Pokemon, { pokemons, moves } from "pokemon";

import Position from "Position";
import Interactable from "Interactable";
import Size from "Size";

export default function(game, loader) {
	let em = game.em;
	loader.load("assets/home.tmx").then(map => {
		game.setMap(map, ["Tile Layer 1", "Tile Layer 2", "Tile Layer 3"], ["Foreground"]);
	});

	game.addPushTrigger(PushTrigger.createWarp(game, 2, 9, 6, 8, "ballettown.js"));

	let mom = em.createEntity()
		.addComponent(Position, 6, 6)
		.addComponent(DirectionComponent, UP)
		.addComponent(Interactable, thread.bind(undefined, function*(game) {
			game.lock();
			game.faceEachOther(mom, game.player);
			yield game.showDialog("Happy birthday! Now that you are 16 I no longer receive Child Benefit, hence you are useless.\n"
				+ "Stop watching anime and go out and play, you son of a bitch.\n"
				+ "I heard Prof. Clark has moved in.\nMaybe you could go bother him.");
			yield game.battle(new Trainer("Charles Ingvar", [
				new Pokemon(pokemons.slowpoke, 4, [ moves.tackle ])
			]));
			game.release();
		}));
	game.loadCharacterSprite(mom, "assets/girlSprite.png");

	// TV
	em.createEntity()
		.addComponent(Position, 5, 4)
		.addComponent(Size, 2, 1)
		.addComponent(Interactable, thread.bind(undefined, function*(game) {
			game.lock();
			yield game.showDialog("A cooking show is airing on the television.");
			yield game.showDialog("\"How to microwave cheese\", starring Gordon Ramsay and macaroni.");
			game.release();
		}));
}
