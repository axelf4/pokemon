var input = require("input.js");
var Position = require("Position.js");
var Direction = require("Direction.js");
var SpriteComponent = require("SpriteComponent.js");
var OldPosition = require("OldPosition.js");
var InteractionComponent = require("InteractionComponent.js");
var MovementComponent = require("MovementComponent.js");
var Animation = require("Animation.js");
var texture = require("texture.js");

var keys = input.keys;
var player;

var PlayerMovementController = function() {};

PlayerMovementController.prototype.getTarget = function(dt, context, position, entity) {
	var em = context.em;
	var direction = em.getComponent(entity, Direction);
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
		for (var i = 0, length = context.pushTriggers.length; i < length; i++) {
			var pushTrigger = context.pushTriggers[i];
			if (pushTrigger.x === pos.x + dx && pushTrigger.y === pos.y + dy) {
				triggered = true;
				pushTrigger.script(context);
			}
		}
		// Move and update position
		if (!triggered && !context.isSolid(pos.x + dx, pos.y + dy)) {
			return direction.value;
		}
	}
	return null;
};

module.exports = function(manager, context) {
	var em = context.em;

	context.player = player = em.createEntity();
	em.addComponent(player, new Position());
	em.addComponent(player, new OldPosition());
	em.addComponent(player, new Direction(Direction.DOWN));
	em.addComponent(player, new MovementComponent(new PlayerMovementController()));

	var textureRegion = new texture.Region();
	textureRegion.loadFromFile(manager, "assets/lucas.png");
	var animation = new Animation(.25, Animation.getSheetFromTexture(4, 2, 2, 32, 32, 4, 2));
	var spriteComponent = new SpriteComponent(textureRegion, animation);
	spriteComponent.offsetX = -8;
	spriteComponent.offsetY = -16;
	em.addComponent(player, spriteComponent);
};

