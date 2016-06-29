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

var PlayerMovementController = function() {};

PlayerMovementController.prototype.getTarget = function(game, dt, position, entity) {
	var em = game.em;
	var pos = em.getComponent(entity, Position);
	var direction = em.getComponent(entity, Direction);

	if (input.pressedKeys[" "]) {
		// Player interacting with shit
		var interactable = game.getEntityAtCell(pos.x + direction.getDeltaX(), pos.y + direction.getDeltaY());
		if (interactable !== null) {
			var interaction = em.getComponent(interactable, InteractionComponent);
			if (interaction) interaction.callback(game);
		}
	}

	var dx = 0, dy = 0;
	if (keys["a"]) {
		direction.value = Direction.LEFT;
		dx = -1;
	} else if (keys["d"]) {
		direction.value = Direction.RIGHT;
		dx = 1;
	} else if (keys["w"]) {
		direction.value = Direction.UP;
		dy = -1;
	} else if (keys["s"]) {
		direction.value = Direction.DOWN;
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
		// Move and update position
		if (!triggered && !game.isSolid(pos.x + dx, pos.y + dy)) {
			return direction.value;
		}
	}
	return null;
};

exports.createPlayer = function(em) {
	var player = em.createEntity();
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

	return player;
};
