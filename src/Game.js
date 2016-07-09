var fowl = require("fowl");
var lerp = require("lerp");
var texture = require("texture.js");
var NinePatch = require("NinePatch.js");
var Map = require("map.js");
var MapRenderer = require("CachedMapRenderer.js");
var Widget = require("Widget.js");
var player = require("player.js");
var StillMovementController = require("StillMovementController.js");
var resources = require("resources.js");
var Stack = require("Stack.js");
var Panel = require("Panel.js");
var Dialog = require("Dialog.js");
var align = require("align.js");
var MovementSystem = require("MovementSystem.js");
var State = require("State.js");
var WidgetGroup = require("WidgetGroup.js");
var input = require("input.js");
var direction = require("direction");
var WalkForwardMovementController = require("WalkForwardMovementController");
var PathMovementController = require("PathMovementController");

var Position = require("Position.js");
var DirectionComponent = require("DirectionComponent.js");
var SpriteComponent = require("SpriteComponent.js");
var PlayerComponent = require("PlayerComponent.js");
var InteractionComponent = require("InteractionComponent.js");
var OldPosition = require("OldPosition.js");
var MovementComponent = require("MovementComponent.js");
var LineOfSightComponent = require("LineOfSightComponent");

var font = resources.font;
fowl.registerComponents(
		Position,
		DirectionComponent,
		SpriteComponent,
		PlayerComponent,
		InteractionComponent,
		OldPosition,
		MovementComponent,
		LineOfSightComponent);

var GameScreen = function(game) {
	Stack.call(this);
	this.game = game;
	this.setFocusable(true);
	this.setDescendantFocusability(WidgetGroup.FOCUS_AFTER_DESCENDANTS);

	this.uiLayer = new Panel();
	this.uiLayer.justify = Panel.ALIGN_FLEX_END;
	this.uiLayer.direction = Panel.DIRECTION_COLUMN;
	this.addWidget(this.uiLayer);
};
GameScreen.prototype = Object.create(Stack.prototype);
GameScreen.prototype.constructor = GameScreen;

GameScreen.prototype.draw = function(batch, dt, time) {
	var game = this.game, em = game.em;

	game.mapRenderer.draw(game.backgroundRenderList);

	for (var entity = 0, length = em.count; entity < length; entity++) {
		if (em.matches(entity, game.spriteSystemMask)) {
			var position = em.getComponent(entity, Position);
			var spriteComponent = em.getComponent(entity, SpriteComponent);

			var texture = spriteComponent.texture;
			var region = spriteComponent.animation.getFrame(time);
			var u1 = (region.x + 0.5) / texture.width;
			var v1 = (region.y + 0.5) / texture.height;
			var u2 = (region.x + region.width - 0.5) / texture.width;
			var v2 = (region.y + region.height - 0.5) / texture.height;
			var x, y;
			if (em.hasComponent(entity, MovementComponent)) {
				var oldpos = em.getComponent(entity, OldPosition);
				var movement = em.getComponent(entity, MovementComponent);
				x = lerp(oldpos.x, position.x, movement.timer / movement.delay) * 16 + spriteComponent.offsetX;
				y = lerp(oldpos.y, position.y, movement.timer / movement.delay) * 16 + spriteComponent.offsetY;
			} else {
				x = position.x * 16 + spriteComponent.offsetX;
				y = position.y * 16 + spriteComponent.offsetY;
			}
			var width = region.width * spriteComponent.scale, height = region.height * spriteComponent.scale;
			batch.draw(texture.texture, x, y, x + width, y + height, u1, v1, u2, v2);
		}
	}
	batch.flush();

	game.mapRenderer.draw(game.foregroundRenderList);

	Stack.prototype.draw.call(this, batch, dt, time);
};

GameScreen.prototype.onKey = function(type, key) {
	if (this.flags & Widget.FLAG_FOCUSED) {
		if (type === input.KEY_ACTION_DOWN) {
			if (key === " ") {
				var game = this.game;
				var em = this.game.em;
				// Hacky way of connecting input to player interacting with shit
				var pos = em.getComponent(game.player, Position);
				var oldpos = em.getComponent(game.player, OldPosition);
				var movement = em.getComponent(game.player, MovementComponent);
				if (pos.x === oldpos.x && pos.y === oldpos.y && movement.getController() instanceof player.PlayerMovementController) {
					var playerDirection = em.getComponent(game.player, DirectionComponent).value;
					var interactable = game.getEntityAtCell(pos.x + direction.getDeltaX(playerDirection), pos.y + direction.getDeltaY(playerDirection));
					if (interactable !== null) {
						var interaction = em.getComponent(interactable, InteractionComponent);
						if (interaction) interaction.callback(game);
					}
				}
			}
		}
	} else {
		Stack.prototype.onKey.call(this, type, key);
	}
};

var Game = function(loader) {
	State.call(this);
	this.loader = loader;

	this.widget = new GameScreen(this);
	this.widget.requestFocus();

	this.map = null;
	this.mapRenderer = null;
	this.foregroundRenderList = null;
	this.backgroundRenderList = null;
	this.metaLayer = -1; // Index of meta layer or -1

	this.em = new fowl.EntityManager();
	this.spriteSystemMask = this.em.getMask([Position, SpriteComponent]);
	this.collisionSystemMask = this.em.getMask([Position]);
	this.movementSystem = new MovementSystem(this);

	this.updateHooks = [];

	this.player = player.createPlayer(loader, this.em);

	this.loadScript("forest.js");
};
Game.prototype = Object.create(State.prototype);
Game.prototype.constructor = Game;

Game.prototype.update = function(dt, time) {
	var em = this.em;
	this.movementSystem.update(dt, time);
	// Call all the registered update hooks
	for (var i = 0, length = this.updateHooks.length; i < length; ++i) {
		this.updateHooks[i](this, dt, em);
	}
};

Game.prototype.say = Game.prototype.showDialog = function(text) {
	var self = this;
	return new Promise(function(resolve, reject) {
		var callback = function() { resolve(); };
		var dialog = new Dialog(text, callback);
		dialog.style.height = 100;
		dialog.style.align = align.STRETCH;
		self.widget.uiLayer.addWidget(dialog);
		dialog.requestFocus();
	});
};

Game.prototype.getMap = function() { return this.map; };

Game.prototype.setMap = function(map, backgroundLayers, foregroundLayers) {
	this.map = map;
	this.mapRenderer = new MapRenderer(map);
	var callback = function(item) {
		if (typeof item === "string" || item instanceof String) {
			return Map.getLayerIdByName(map, item);
		}
		throw new Error("Unknown type of layer id");
	};
	backgroundLayers = backgroundLayers.map(callback);
	foregroundLayers = foregroundLayers.map(callback);
	this.backgroundRenderList = this.mapRenderer.getRenderList(backgroundLayers);
	this.foregroundRenderList = this.mapRenderer.getRenderList(foregroundLayers);
	this.metaLayer = -1;
	for (var i = 0, length = map.layers.length; i < length; ++i) {
		if (map.layers[i].name === "meta") {
			this.metaLayer = i;
		}
	}
};

Game.prototype.loadScript = function(name) {
	this.loader.loadScript(name).then(script => script(this, this.loader));
};

Game.prototype.addUpdateHook = function(hook) {
	this.updateHooks.push(hook);
};

Game.prototype.removeUpdateHook = function(hook) {
	var idx = updateHooks.indexOf(hook);
	this.updateHooks.splice(idx, 1);
};

Game.prototype.getPlayer = function() {
	return this.player;
}

Game.prototype.lock = function() {
	var playerMovement = this.em.getComponent(this.player, MovementComponent);
	playerMovement.pushController(new StillMovementController());
};

Game.prototype.release = function() {
	var playerMovement = this.em.getComponent(this.player, MovementComponent);
	playerMovement.popController();
};

/**
 * Returns the entity at tile x,y or null if there is none.
 */
Game.prototype.getEntityAtCell = function(x, y) {
	var em = this.em;
	var result = null;
	for (var entity = 0, length = em.count; entity < length; entity++) {
		if (em.matches(entity, this.collisionSystemMask)) {
			var position = em.getComponent(entity, Position);
			if (position.x === x && position.y === y) {
				result = entity;
				break;
			}
			/*if (em.hasComponent(entity, OldPosition)) {
				var oldpos = em.getComponent(entity, OldPosition);
				if (oldpos.x === x && oldpos.y === y) {
					result = entity;
					break;
				}
			}*/
		}
	}
	return result;
};

Game.prototype.isSolid = function(x, y) {
	// Check for entity at cell
	if (this.getEntityAtCell(x, y) !== null) return true;
	// Check for collidable tile at cell
	var map = this.map, metaLayer = this.metaLayer;
	if (metaLayer !== -1) return map.layers[metaLayer].data[x + map.width * y];
	throw new Error("Current map has no meta layer.");
};

Game.prototype.pushTriggers = [];

Game.prototype.clearLevel = function() {
	this.pushTriggers = [];
};

/**
 * Warps the player to target coordinates and, optionally, specified map.
 */
Game.prototype.warp = function(x, y, mapScript) {
	var em = this.em;
	var pos = em.getComponent(this.player, Position);
	var oldpos = em.getComponent(this.player, OldPosition);
	oldpos.x = pos.x = x;
	oldpos.y = pos.y = y;
	if (mapScript !== undefined) {
		if (mapScript === null) throw new Error("mapScript cannot be null.");
		game.clearLevel();
		game.loadScript(mapScript);
	}
};

Game.prototype.save = JSON.parse(window.localStorage.getItem("gameSave"));

Game.prototype.saveTheGame = function() {
	window.localStorage.setItem("gameSave", JSON.stringify(save));
};

Game.prototype.wait = function(ms) {
	return new Promise(function(resolve, reject) {
		window.setTimeout(resolve, ms);
	});
};

Game.prototype.walkForward = function(entity) {
	return new Promise((resolve, reject) => {
		var em = this.em;
		var movement = em.getComponent(entity, MovementComponent);
		var controller = new WalkForwardMovementController(() => {
			movement.popController();
			resolve();
		});
		movement.pushController(controller);
	});
};

/**
 * Returns the found entity or -1.
 */
Game.prototype.findEntityInLineOfSight = function(caster) {
	var em = this.em;
	var pos1 = em.getComponent(caster, Position);
	var dir = em.getComponent(caster, DirectionComponent).value; // The direction of the line of sight
	var LoS = em.getComponent(caster, LineOfSightComponent); // LoS

	for (var entity = 0, length = em.count; entity < length; ++entity) {
		if (entity === caster) continue; // Can't see itself!

		if (em.matches(entity, this.collisionMask)) {
			var pos2 = em.getComponent(entity, Position);
			var dx = direction.getDeltaX(dir), dy = direction.getDeltaY(dir);

			// TODO change -1 to Infinity
			for (var step = 1, max = LoS.length; max === -1 || step <= max; ++step) {
				var x = pos1.x + step * dx, y = pos1.y + step * dy;

				if (pos2.x === x && pos2.y === y) {
					return entity;
				}

				// If the sight is obstructed: quit
				if (this.isSolid(x, y)) {
					break;
				}

			}
		}
	}
	return -1;
};

Game.prototype.facePlayer = function(entity) {
	var em = this.em;
	var entityPos = em.getComponent(entity, Position);
	var playerPos = em.getComponent(this.player, Position);
	em.getComponent(entity, DirectionComponent).value = direction.getDirectionToPos(entityPos, playerPos);
};

Game.prototype.walkPath = function(entity, path) {
	return new Promise((resolve, reject) => {
		var em = this.em;
		var movement = em.getComponent(entity, MovementComponent);
		movement.pushController(new PathMovementController(path, () => {
			movement.popController();
			resolve();
		}));
	});
};

/*audio.loadAudio("assets/masara-town.mp3", function(buffer) {
	var source = audio.playAudio(buffer);
	source.loop = true;
});*/

module.exports = Game;
