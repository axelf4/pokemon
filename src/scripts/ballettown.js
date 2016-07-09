var Map = require("map.js");
var direction = require("direction");
var PushTrigger = require("PushTrigger.js");
var thread = require("thread");

var Position = require("Position");
var DirectionComponent = require("DirectionComponent");
var InteractionComponent = require("InteractionComponent");
var LineOfSightComponent = require("LineOfSightComponent");

module.exports = function(game, loader) {
	loader.loadMap("assets/ballet-town.tmx").then(map => {
		game.setMap(map, ["Tile Layer 1", "Tile Layer 2"], ["Foreground"]);
	});

	game.pushTriggers.push(PushTrigger.createEdgeWarp(game, direction.UP, 0, 0, "forest.js", true));

	var em = game.em;
	var player = game.player;
	var playerPos = em.getComponent(player, Position);
	playerPos.x = 6;
	playerPos.y = 8;

	var sign = em.createEntity();
	em.addComponent(sign, new Position(10, 10));
	em.addComponent(sign, new InteractionComponent(thread.bind(undefined, function*(game) {
			game.lock();
			yield game.showDialog("Welcome to Ballet Town.");
			game.release();
	})));

	var bulletinBoardInteraction = new InteractionComponent(thread.bind(undefined, function*(game) {
			game.lock();
			yield game.showDialog("Several photos of Abraham Lincoln, Nelson Mandella and Barack Obama are pinned to the board.");
			yield game.showDialog("Red crosses have been drawn over Lincoln's and Mandella's faces.");
			game.release();
	}));
	var bulletinBoard1 = em.createEntity();
	var bulletinBoard2 = em.createEntity();
	em.addComponent(bulletinBoard1, new Position(15, 19));
	em.addComponent(bulletinBoard2, new Position(16, 19));
	em.addComponent(bulletinBoard1, bulletinBoardInteraction);
	em.addComponent(bulletinBoard2, bulletinBoardInteraction);

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
