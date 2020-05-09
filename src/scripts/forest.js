var Animation = require("Animation.js");
import thread from "thread";
var PushTrigger = require("PushTrigger.js");
var Position = require("Position.js");
var SpriteComponent = require("SpriteComponent.js");
import { Movement, StillMovementController, RandomMovementController } from "movement";
var direction = require("direction");
import wait from "wait";

module.exports = function(game, loader) {
	loader.loadMap("assets/forest.tmx").then(map => {
		game.setMap(map, ["Tile Layer 1", "Tile Layer 2"], ["Foreground"]);
	});

	game.pushTriggers.push(PushTrigger.createEdgeWarp(game, direction.DOWN, 22, 0));

	var em = game.em;

	var item = em.createEntity();
	em.addComponent(item, new Position(13, 5));
	em.addComponent(item, new InteractionComponent(thread.bind(undefined, function*(game) {
			game.lock();
			yield game.showDialog("It's a pokéball. What did you expect?");
			yield game.walkPath(game.player, [direction.DOWN, direction.DOWN]);
			yield game.showDialog("Hello");
			game.release();
	})));

	var lollipopMan = em.createEntity();
	em.addComponent(lollipopMan, new Position(12, 5));
	em.addComponent(lollipopMan, new DirectionComponent(direction.DOWN));
	loader.loadTexture("assets/dancer.png").then(textureRegion => {
		var animation = new Animation(500, Animation.getSheetFromTexture(1, 0, 0, 32, 32));
		var spriteComponent = new SpriteComponent(textureRegion, animation);
		spriteComponent.offsetX = -8;
		spriteComponent.offsetY = -16;
		em.addComponent(lollipopMan, spriteComponent);
	});
	var controller = new RandomMovementController();
	em.addComponent(lollipopMan, new MovementComponent(controller));
	em.addComponent(lollipopMan, new LineOfSightComponent(thread.bind(undefined, (function*(game, em, caster, blocker) {
		if (blocker !== game.player) return;
		[caster, blocker].forEach(game.snapEntity.bind(game));
		var playerMovement = game.em.getComponent(game.getPlayer(), MovementComponent);
		var entityMovement = game.em.getComponent(lollipopMan, MovementComponent);
		playerMovement.pushController(new StillMovementController());
		entityMovement.pushController(new StillMovementController());
		yield game.walkForward(lollipopMan);
		yield game.showDialog("Why, hello there little boy. Want a lollipop?");
		yield wait(1000);
		yield game.showDialog("You've been struck by the lollipop man.");
		playerMovement.popController();
		entityMovement.popController();
	}))));
	em.addComponent(lollipopMan, new InteractionComponent(thread.bind(undefined, function*(game) {
		var playerMovement = game.em.getComponent(game.getPlayer(), MovementComponent);
		var entityMovement = game.em.getComponent(lollipopMan, MovementComponent);
		game.faceEachOther(game.getPlayer(), lollipopMan);
		playerMovement.pushController(new StillMovementController());
		entityMovement.pushController(new StillMovementController());
		yield game.showDialog("So you approach me voluntarily? You've got some guts!");
		playerMovement.popController();
		entityMovement.popController();
	})));
};
