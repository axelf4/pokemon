var input = require("input.js");
var Position = require("Position.js");
var Direction = require("Direction.js");
var SpriteComponent = require("SpriteComponent.js");
var OldPosition = require("OldPosition.js");
var InteractionComponent = require("InteractionComponent.js");
var MovementComponent = require("MovementComponent.js");
var Animation = require("Animation.js");
var texture = require("texture.js");
var game = require("Game.js");

var keys = input.keys;
var player;

var PlayerMovementController = function() {};

PlayerMovementController.prototype.getTarget = function(dt, position, entity) {
	var em = game.em;
	var pos = em.getComponent(entity, Position);
	var direction = em.getComponent(entity, Direction);

	// TODO move this to external system and implement focus for the panes
	if (input.pressedKeys.indexOf(32) !== -1) {
		if (!game.getDialogue()) {
			// Player interacting with shit
			var entity2 = game.getEntityAtCell(em, pos.x + direction.getDeltaX(), pos.y + direction.getDeltaY());
			if (entity2 !== null) {
				var interactable = em.getComponent(entity2, InteractionComponent);
				if (interactable) interactable.callback(game);
			}
		}
	}

	var dx = 0, dy = 0;
	if (keys[65]) {
		direction.value = Direction.LEFT;
		dx = -1;
	} else if (keys[68]) {
		direction.value = Direction.RIGHT;
		dx = 1;
	} else if (keys[87]) {
		direction.value = Direction.UP;
		dy = -1;
	} else if (keys[83]) {
		direction.value = Direction.DOWN;
		dy = 1;
	}

	if (dx != 0 || dy != 0) {
		// Check for push triggers
		var triggered = false;
		for (var i = 0, length = game.pushTriggers.length; i < length; i++) {
			var pushTrigger = game.pushTriggers[i];
			if (pushTrigger.x === pos.x + dx && pushTrigger.y === pos.y + dy) {
				triggered = true;
				pushTrigger.script();
			}
		}
		// Move and update position
		if (!triggered && !game.isSolid(pos.x + dx, pos.y + dy)) {
			return direction.value;
		}
	}
	return null;
};

module.exports = function() {
	var em = game.em;

	game.player = player = em.createEntity();
	em.addComponent(player, new Position());
	em.addComponent(player, new OldPosition());
	em.addComponent(player, new Direction(Direction.DOWN));
	em.addComponent(player, new MovementComponent(new PlayerMovementController()));

	var textureRegion = new texture.Region();
	textureRegion.loadFromFile("assets/lucas.png");
	var animation = new Animation(250, Animation.getSheetFromTexture(4, 2, 2, 32, 32, 4, 2));
	var spriteComponent = new SpriteComponent(textureRegion, animation);
	spriteComponent.offsetX = -8;
	spriteComponent.offsetY = -16;
	em.addComponent(player, spriteComponent);
};

