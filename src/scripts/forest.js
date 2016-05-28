var Map = require("map.js");
var Position = require("Position.js");
var InteractionComponent = require("InteractionComponent.js");
var texture = require("texture.js");
var Animation = require("Animation.js");
var PushTrigger = require("PushTrigger.js");
var SpriteComponent = require("SpriteComponent.js");
var Direction = require("Direction.js");
var OldPosition = require("OldPosition.js");
var MovementComponent = require("MovementComponent.js");
var RandomMovementController = require("RandomMovementController.js");
var StillMovementController = require("StillMovementController.js");
var loader = require("loader.js");
var game = require("Game.js");

var thread = function(fn) {
	var gen = fn();
	if (typeof gen.next !== "function") return;
	var next = function(err, res) {
		var ret = gen.next(res);
		if (ret.done) return;

		if (typeof ret.value.then === "function") {
			ret.value.then(next);
		} else ret.value(next);
	};
	next();
};

module.exports = function() {
	var promise = Map.loadMap("assets/forest.tmx");
	promise.then(function(map) {
		game.setMap(map, ["Tile Layer 1", "Tile Layer 2"], ["Foreground"]);
	});

	// game.setMapFromJSON("assets/forest.json", ["Tile Layer 1", "Tile Layer 2"], ["Foreground"]);

	game.pushTriggers.push(new PushTrigger(3, 13, PushTrigger.createWarp("ballettown.js", 22, 0)));

	var em = game.em;

	var item = em.createEntity();
	em.addComponent(item, new Position(13, 5));
	em.addComponent(item, new InteractionComponent(function() {
		thread(function*() {
			game.lock();
			yield game.showDialogue("It's a pokéball. What did you expect?");
			yield game.wait(1000);
			yield game.showDialogue("Hello");
			game.release();
		});
	}));

	var jorryt = em.createEntity();
	var x = 12, y = 5;
	em.addComponent(jorryt, new Position(x, y));
	em.addComponent(jorryt, new OldPosition(x, y));
	em.addComponent(jorryt, new Direction());
	var textureRegion = new texture.Region();
	textureRegion.loadFromFile("assets/dancer.png");
	var animation = new Animation(500, Animation.getSheetFromTexture(1, 0, 0, 32, 32));
	var spriteComponent = new SpriteComponent(textureRegion, animation);
	spriteComponent.offsetX = -8;
	spriteComponent.offsetY = -16;
	em.addComponent(jorryt, spriteComponent);
	var controller = new RandomMovementController();
	em.addComponent(jorryt, new MovementComponent(controller));
	em.addComponent(jorryt, new InteractionComponent(function() {
		thread(function*() {
			var playerMovement = game.em.getComponent(game.getPlayer(), MovementComponent);
			var entityMovement = game.em.getComponent(jorryt, MovementComponent);
			playerMovement.pushController(new StillMovementController());
			entityMovement.pushController(new StillMovementController());
			yield game.showDialogue("I could be a girl, you could be a boy. Transsexuality is so fun!");
			yield game.showDialogue("What's up with that jar of nutella? Still fighting the good fight.");
			playerMovement.popController();
			entityMovement.popController();
		});
	}));
};
