var Map = require("map.js");
var direction = require("direction");
var PushTrigger = require("PushTrigger.js");
var thread = require("thread");

var Position = require("Position");
var DirectionComponent = require("DirectionComponent");
var InteractionComponent = require("InteractionComponent");
var LineOfSightComponent = require("LineOfSightComponent");
var DimensionComponent = require("DimensionComponent");

module.exports = function(game, loader) {
	loader.loadMap("assets/ballet-town.tmx").then(map => {
		game.setMap(map, ["Tile Layer 1", "Tile Layer 2"], ["Foreground"]);
	});

	game.addPushTrigger(PushTrigger.createEdgeWarp(game, direction.UP, 0, 0, "forest.js", true));
	game.addPushTrigger(PushTrigger.createWarp(game, 6, 7, 2, 8, "home.js"));
	game.addPushTrigger(PushTrigger.createWarp(game, 16, 14, 5, 11, "professorHouse.js"));

	var em = game.em;

	var sign = em.createEntity();
	em.addComponent(sign, new Position(10, 10));
	em.addComponent(sign, new InteractionComponent(thread.bind(undefined, function*(game) {
			game.lock();
			yield game.showDialog("Welcome to Ballet Town.");
			game.release();
	})));

	var lockedDoor = em.createEntity();
	em.addComponent(lockedDoor, new Position(15, 7));
	em.addComponent(lockedDoor, new InteractionComponent(thread.bind(undefined, function*(game) {
			game.lock();
			yield game.showDialog("The door is locked AF.");
			game.release();
	})));

	var bulletinBoard = em.createEntity();
	em.addComponent(bulletinBoard, new Position(15, 19));
	em.addComponent(bulletinBoard, new InteractionComponent(thread.bind(undefined, function*(game) {
			game.lock();
			yield game.showDialog("Several photos of Abraham Lincoln, Nelson Mandella and Barack Obama are pinned to the board.");
			yield game.showDialog("Red crosses have been drawn over Lincoln's and Mandella's faces.");
			game.release();
	})));
	em.addComponent(bulletinBoard, new DimensionComponent(2, 1));

	var littleGirl = em.createEntity();
	em.addComponent(littleGirl, new Position(11, 2));
	em.addComponent(littleGirl, new DirectionComponent(direction.RIGHT));
	game.loadCharacterSprite(littleGirl, "assets/girlSprite.png");
	em.addComponent(littleGirl, new LineOfSightComponent(thread.bind(undefined, function*(game, em, caster, blocker) {
		if (blocker !== game.player) return;
		game.snapEntity(blocker);
		game.lock();
		game.faceEachOther(caster, blocker);
		yield game.showDialog("Only big boys can come through here.");
		yield game.walkPath(game.player, [direction.DOWN]);
		game.release();
	})));
	em.addComponent(littleGirl, new InteractionComponent(thread.bind(undefined, function*(game) {
		game.lock();
		game.faceEachOther(littleGirl, game.player);
		yield game.showDialog("I am a big boy.");
		game.faceDirection(littleGirl, direction.RIGHT);
		game.release();
	})));
};
