var Map = require("map.js");
var InteractionComponent = require("InteractionComponent.js");
var Animation = require("Animation.js");
var thread = require("thread.js");
var PushTrigger = require("PushTrigger.js");
var Position = require("Position.js");
var SpriteComponent = require("SpriteComponent.js");
var DirectionComponent = require("DirectionComponent.js");
var OldPosition = require("OldPosition.js");
var MovementComponent = require("MovementComponent.js");
var RandomMovementController = require("RandomMovementController.js");
var StillMovementController = require("StillMovementController.js");
var direction = require("direction");

module.exports = function(game, loader) {
	loader.loadMap("assets/forest.tmx")
		.then(function(map) {
			game.setMap(map, ["Tile Layer 1", "Tile Layer 2"], ["Foreground"]);
		});

	// game.pushTriggers.push(new PushTrigger(3, 13, PushTrigger.createWarp("ballettown.js", 22, 0)));
	game.pushTriggers.push(PushTrigger.createEdgeWarp(game, direction.DOWN, 22, 0));

	var em = game.em;

	var item = em.createEntity();
	em.addComponent(item, new Position(13, 5));
	em.addComponent(item, new InteractionComponent(function() {
		thread(function*() {
			game.lock();
			yield game.showDialog("It's a pokéball. What did you expect?");
			// yield game.wait(1000);
			yield game.showDialog("Hello");
			game.release();
		});
	}));

	var jorryt = em.createEntity();
	var x = 12, y = 5;
	em.addComponent(jorryt, new Position(x, y));
	em.addComponent(jorryt, new OldPosition(x, y));
	em.addComponent(jorryt, new DirectionComponent());
	loader.loadTextureRegion("assets/dancer.png").then(textureRegion => {
		var animation = new Animation(500, Animation.getSheetFromTexture(1, 0, 0, 32, 32));
		var spriteComponent = new SpriteComponent(textureRegion, animation);
		spriteComponent.offsetX = -8;
		spriteComponent.offsetY = -16;
		em.addComponent(jorryt, spriteComponent);
	});
	var controller = new RandomMovementController();
	em.addComponent(jorryt, new MovementComponent(controller));
	em.addComponent(jorryt, new InteractionComponent(function() {
		thread(function*() {
			var playerMovement = game.em.getComponent(game.getPlayer(), MovementComponent);
			var entityMovement = game.em.getComponent(jorryt, MovementComponent);
			playerMovement.pushController(new StillMovementController());
			entityMovement.pushController(new StillMovementController());
			yield game.showDialog("I could be a girl, you could be a boy. Transsexuality is so fun!");
			yield game.showDialog("What's up with that jar of nutella? Still fighting the good fight.");
			// TODO add jar of nutella to player inventory
			playerMovement.popController();
			entityMovement.popController();
		});
	}));
};
