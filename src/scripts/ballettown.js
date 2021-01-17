import {DirectionComponent, UP, DOWN, RIGHT} from "direction";
var PushTrigger = require("PushTrigger.js");
import thread from "thread";
import save from "savegame";

import Position from "Position";
import Interactable from "Interactable";
import Size from "Size";
import {LineOfSight} from "movement";

export default function(game, loader) {
	let em = game.em;
	loader.load("assets/ballet-town.tmx").then(map => {
		game.setMap(map, ["Tile Layer 1", "Tile Layer 2"], ["Foreground"]);
	});

	game.addPushTrigger(PushTrigger.createEdgeWarp(game, UP, 0, 0, "forest.js", true));
	game.addPushTrigger(PushTrigger.createWarp(game, 6, 7, 2, 8, "home.js"));
	game.addPushTrigger(PushTrigger.createWarp(game, 16, 14, 5, 11, "professorHouse.js"));

	let sign = em.createEntity()
		.addComponent(Position, 10, 10)
		.addComponent(Interactable, thread.bind(undefined, function*(game) {
			game.lock();
			yield game.showDialog("Welcome to Ballet Town.");
			game.release();
		}));

	let lockedDoor = em.createEntity()
		.addComponent(Position, 15, 7)
		.addComponent(Interactable, thread.bind(undefined, function*(game) {
			game.lock();
			yield game.showDialog("The door is locked AF.");
			game.release();
		}));

	let bulletinBoard = em.createEntity()
		.addComponent(Position, 15, 19)
		.addComponent(Interactable, thread.bind(undefined, function*(game) {
			game.lock();
			yield game.showDialog("Several photos of Abraham Lincoln, Nelson Mandella and Barack Obama are pinned to the board. Red crosses have been drawn over Lincoln's and Mandella's faces.");
			game.release();
		}))
		.addComponent(Size, 2, 1);

	let littleGirl = em.createEntity()
	.addComponent(Position, 11, 2)
	.addComponent(DirectionComponent, RIGHT)
	.addComponent(LineOfSight, thread.bind(undefined, function*(game, em, caster, blocker) {
		if (blocker !== game.player) return;
		if (save.hasGottenPokemon) return;
		game.snapEntity(blocker);
		game.lock();
		game.faceEachOther(caster, blocker);
		yield game.showDialog("Only big boys can come through here.");
		yield game.walkPath(game.player, [DOWN]);
		game.release();
	}))
	.addComponent(Interactable, thread.bind(undefined, function*(game) {
		game.lock();
		game.faceEachOther(littleGirl, game.player);
		yield game.showDialog("I am a big boy.");
		game.faceDirection(littleGirl, RIGHT);
		game.release();
	}));
	game.loadCharacterSprite(littleGirl, "assets/girlSprite.png");
}
