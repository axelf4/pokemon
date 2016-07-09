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
var AnimationComponent = require("AnimationComponent");

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
		var tileX = pos.x + dx, tileY = pos.y + dy;
		for (var i = 0, length = game.pushTriggers.length; i < length; ++i) {
			var pushTrigger = game.pushTriggers[i];
			if (pushTrigger.runForTile(tileX, tileY)) {
				triggered = true;
			}
		}
		// Check for collision if there were no trigger
		if (!triggered && !game.isSolid(tileX, tileY)) {
			return dir.value;
		}
	}
	return direction.NO_DIRECTION;
};

exports.createPlayer = function(game, loader, em) {
	var player = em.createEntity();
	em.addComponent(player, new Position());
	em.addComponent(player, new OldPosition());
	em.addComponent(player, new DirectionComponent(direction.DOWN));
	em.addComponent(player, new MovementComponent(new PlayerMovementController()));

	game.loadCharacterSprite(player, "assets/playerSprite.png");

	return player;
};
