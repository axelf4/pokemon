var input = require("input.js");
var direction = require("direction.js");
var Position = require("Position.js");
var DirectionComponent = require("DirectionComponent.js");
var SpriteComponent = require("SpriteComponent.js");
var OldPosition = require("OldPosition.js");
var InteractionComponent = require("InteractionComponent.js");
var MovementComponent = require("MovementComponent.js");
var Animation = require("Animation.js");
var texture = require("texture.js");

var keys = input.keys;

var PlayerMovementController = exports.PlayerMovementController = function() {};

PlayerMovementController.prototype.getTarget = function(game, dt, position, entity) {
	var em = game.em;
	var pos = em.getComponent(entity, Position);
	var dir = em.getComponent(entity, DirectionComponent);

	var dx = 0, dy = 0;
	if (keys["a"]) {
		dir.value = direction.LEFT;
		dx = -1;
	} else if (keys["d"]) {
		dir.value = direction.RIGHT;
		dx = 1;
	} else if (keys["w"]) {
		dir.value = direction.UP;
		dy = -1;
	} else if (keys["s"]) {
		dir.value = direction.DOWN;
		dy = 1;
	}

	if (dx != 0 || dy != 0) {
		// Check for push triggers
		var triggered = false;
		for (var i = 0, length = game.pushTriggers.length; i < length; ++i) {
			var pushTrigger = game.pushTriggers[i];
			if (pushTrigger.x === pos.x + dx && pushTrigger.y === pos.y + dy) {
				triggered = true;
				pushTrigger.script();
			}
		}
		// Check for collision if there were no trigger
		if (!triggered && !game.isSolid(pos.x + dx, pos.y + dy)) {
			return dir.value;
		}
	}
	return direction.NO_DIRECTION;
};

exports.createPlayer = function(em) {
	var player = em.createEntity();
	em.addComponent(player, new Position());
	em.addComponent(player, new OldPosition());
	em.addComponent(player, new DirectionComponent(direction.DOWN));
	em.addComponent(player, new MovementComponent(new PlayerMovementController()));

	var textureRegion = new texture.Region();
	textureRegion.loadFromFile("assets/lucas.png");
	var animation = new Animation(250, Animation.getSheetFromTexture(4, 2, 2, 32, 32, 4, 2));
	var spriteComponent = new SpriteComponent(textureRegion, animation);
	spriteComponent.offsetX = -8;
	spriteComponent.offsetY = -16;
	em.addComponent(player, spriteComponent);

	return player;
};
