var fowl = require("fowl");
var Position = require("Position.js");
var Direction = require("Direction.js");
var OldPosition = require("OldPosition.js");
var MovementComponent = require("MovementComponent.js");

var mask = fowl.getMask([Position, OldPosition, Direction, MovementComponent]);

var update = function(game, dt, em) {
	for (var entity = 0, length = em.count; entity < length; entity++) {
		if (em.matches(entity, mask)) {
			var position = pos = em.getComponent(entity, Position);
			var oldpos = em.getComponent(entity, OldPosition);
			var direction = em.getComponent(entity, Direction);
			var movement = em.getComponent(entity, MovementComponent);

			movement.timer += dt;
			if (movement.timer >= movement.delay || pos.x === oldpos.x && pos.y === oldpos.y) {
				oldpos.x = pos.x;
				oldpos.y = pos.y;
				movement.timer = 0;
				var controller = movement.getController();
				if (controller) {
					var newDirection = controller.getTarget(game, dt, position, entity);
					pos.x += Direction.getDeltaX(newDirection);
					pos.y += Direction.getDeltaY(newDirection);
				}
			}
		}
	}
};

module.exports = function(game) {
	game.addUpdateHook(update);
};
