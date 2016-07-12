var fowl = require("fowl");
var lerp = require("lerp");
var texture = require("texture.js");
var NinePatch = require("NinePatch.js");
var Map = require("map.js");
// var MapRenderer = require("OrthogonalMapRenderer.js");
var CachedMapRenderer = require("CachedMapRenderer.js");
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
var Animation = require("Animation");
var glMatrix = require("gl-matrix");
var Select = require("Select");

var Position = require("Position.js");
var DirectionComponent = require("DirectionComponent.js");
var SpriteComponent = require("SpriteComponent.js");
var PlayerComponent = require("PlayerComponent.js");
var InteractionComponent = require("InteractionComponent.js");
var OldPosition = require("OldPosition.js");
var MovementComponent = require("MovementComponent.js");
var LineOfSightComponent = require("LineOfSightComponent");
var AnimationComponent = require("AnimationComponent");
var DimensionComponent = require("DimensionComponent");

var mat4 = glMatrix.mat4;
var vec3 = glMatrix.vec3;

var font = resources.font;
fowl.registerComponents(
		Position,
		DirectionComponent,
		SpriteComponent,
		PlayerComponent,
		InteractionComponent,
		OldPosition,
		MovementComponent,
		LineOfSightComponent,
		AnimationComponent,
		DimensionComponent);

var mvMatrix = mat4.create();
var positionVector = vec3.create();
var up = vec3.fromValues(0, 1, 0);
var tmp = vec3.create();
var directionVector = vec3.fromValues(0, 0, -1);

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
	var game = this.game, em = game.em, player = game.player;

	var width = this.width, height = this.height;
	var pos = em.getComponent(player, Position);
	var oldpos = em.getComponent(player, OldPosition);
	var movement = em.getComponent(player, MovementComponent);
	var transformX = lerp(oldpos.x, pos.x, movement.timer / movement.delay) * 16 - width / 2;
	var transformY = lerp(oldpos.y, pos.y, movement.timer / movement.delay) * 16 - height / 2;
	vec3.set(positionVector, transformX, transformY, 0);

	vec3.copy(tmp, positionVector);
	vec3.add(tmp, tmp, directionVector);
	mat4.lookAt(mvMatrix, positionVector, tmp, up);
	// mat4.fromTranslation(mvMatrix, positionVector);
	var oldTransformMatrix = batch.getTransformMatrix();
	batch.setTransformMatrix(mvMatrix);

	game.mapRenderer.drawLayers(game.backgroundLayers, transformX, transformY, this.width, this.height);

	batch.begin();
	for (var entity = 0, length = em.count; entity < length; entity++) {
		if (em.matches(entity, game.spriteSystemMask)) {
			var position = em.getComponent(entity, Position);
			var spriteComponent = em.getComponent(entity, SpriteComponent);
			var movement = em.hasComponent(entity, MovementComponent) ? em.getComponent(entity, MovementComponent) : null;

			var texture = spriteComponent.texture;
			var region;
			if (em.hasComponent(entity, AnimationComponent)) {
				var dir = em.getComponent(entity, DirectionComponent).value;
				var animation = em.getComponent(entity, AnimationComponent).getAnimation(dir);
				if (!movement || movement.timer === 0) region = animation.getFrameByIndex(0);
				else region = animation.getFrame(time);
			} else {
				if (spriteComponent.animation) {
					region = spriteComponent.animation.getFrame(time);
				} else region = spriteComponent.region;
			}

			var u1 = (region.x + 0.5) / texture.width;
			var v1 = (region.y + 0.5) / texture.height;
			var u2 = (region.x + region.width - 0.5) / texture.width;
			var v2 = (region.y + region.height - 0.5) / texture.height;

			var x, y;
			if (movement !== null) {
				var oldpos = em.getComponent(entity, OldPosition);
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
	batch.end();

	game.mapRenderer.drawLayers(game.foregroundLayers, transformX, transformY, this.width, this.height);

	batch.setTransformMatrix(oldTransformMatrix);

	batch.begin();
	Stack.prototype.draw.call(this, batch, dt, time);
	batch.end();
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

var Game = function(loader, batch) {
	State.call(this);
	this.loader = loader;
	this.batch = batch;

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
	this.pushTriggers = [];

	this.player = player.createPlayer(this, loader, this.em);
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

Game.prototype.multichoice = function(label, optionNames) {
	var uiLayer = this.widget.uiLayer;
	return new Promise(function(resolve, reject) {
		var select = new Select(optionNames, 1, selected => {
			uiLayer.removeAllWidgets();
			resolve(selected);
		});
		select.style.align = align.START;
		uiLayer.addWidget(select);
		select.requestFocus();
		var dialog = new Dialog(label);
		dialog.style.align = align.STRETCH;
		dialog.style.height = 100;
		uiLayer.addWidget(dialog);
	});
};

Game.prototype.getMap = function() { return this.map; };

Game.prototype.setMap = function(map, backgroundLayers, foregroundLayers) {
	this.map = map;
	// this.mapRenderer = new MapRenderer(map, this.batch);
	this.mapRenderer = new CachedMapRenderer(map);
	var callback = function(item) {
		if (typeof item === "string" || item instanceof String) {
			return Map.getLayerIdByName(map, item);
		} else if (typeof item === "number") {
			return item;
		}
		throw new TypeError("Unknown type of layer id.");
	};
	this.backgroundLayers = backgroundLayers.map(callback);
	this.foregroundLayers = foregroundLayers.map(callback);
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

Game.prototype.lock = function(entity) {
	if (!entity) entity = this.player;
	var movement = this.em.getComponent(entity, MovementComponent);
	movement.pushController(new StillMovementController());
};

Game.prototype.release = function(entity) {
	if (!entity) entity = this.player;
	var movement = this.em.getComponent(entity, MovementComponent);
	movement.popController();
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
			if (em.hasComponent(entity, DimensionComponent)) {
				var dimension = em.getComponent(entity, DimensionComponent);
				if (position.x <= x && position.x + dimension.width > x
						&& position.y <= y && position.y + dimension.height > y) {
					result = entity;
					break;
				}
			} else {
				if (position.x === x && position.y === y) {
					result = entity;
					break;
				}
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
	// Can't walk outside map boundaries
	if (x < 0 || x >= this.map.width || y < 0 || y >= this.map.height) return true;
	// Check for entity at cell
	if (this.getEntityAtCell(x, y) !== null) return true;
	// Check for collidable tile at cell
	var map = this.map, metaLayer = this.metaLayer;
	if (metaLayer !== -1) return map.layers[metaLayer].data[x + map.width * y];
	throw new Error("Current map has no meta layer.");
};

Game.prototype.getPushTriggers = function() {
	return this.pushTriggers;
};

Game.prototype.addPushTrigger = function(pushTrigger) {
	this.pushTriggers.push(pushTrigger);
};

Game.prototype.clearLevel = function() {
	this.pushTriggers = [];
	var em = this.em, player = this.player;
	for (var entity = 0, length = em.count; entity < length; ++entity) {
		if (entity !== player) em.removeEntity(entity);
	}
};

/**
 * Warps the player to target coordinates and, optionally, specified map.
 */
Game.prototype.warp = function(x, y, mapScript, relative) {
	var em = this.em;
	var pos = em.getComponent(this.player, Position);
	var oldpos = em.getComponent(this.player, OldPosition);
	if (relative) {
		oldpos.x = pos.x = pos.x - x;
		oldpos.y = pos.y = pos.y - y;
	} else {
		oldpos.x = pos.x = x;
		oldpos.y = pos.y = y;
	}
	if (mapScript !== undefined) {
		if (mapScript === null) throw new Error("mapScript cannot be null.");
		this.clearLevel();
		this.loadScript(mapScript);
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

			for (var step = 1, max = LoS.length; step <= max; ++step) {
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

/**
 * Snaps the entity to the next tile.
 *
 * The entity must have a Position component.
 */
Game.prototype.snapEntity = function(entity) {
	var em = this.em;
	if (em.hasComponent(entity, MovementComponent)) em.getComponent(entity, MovementComponent).timer = 0;
	if (em.hasComponent(entity, OldPosition)) {
		var pos = em.getComponent(entity, Position);
		var oldpos = em.getComponent(entity, OldPosition);
		oldpos.x = pos.x;
		oldpos.y = pos.y;
	}
};

Game.prototype.loadCharacterSprite = function(entity, url) {
	return this.loader.loadTextureRegion(url).then(textureRegion => {
		var em = this.em;
		var spriteComponent = new SpriteComponent(textureRegion);
		spriteComponent.offsetX = -8;
		spriteComponent.offsetY = -16;
		em.addComponent(entity, spriteComponent);
		var animations = {
			down: new Animation(250, Animation.getSheetFromTexture(4, 0, 0, 32, 32, 4, 0)),
			up: new Animation(250, Animation.getSheetFromTexture(4, 0, 32, 32, 32, 4, 0)),
			left: new Animation(250, Animation.getSheetFromTexture(4, 0, 64, 32, 32, 4, 0)),
			right: new Animation(250, Animation.getSheetFromTexture(4, 0, 96, 32, 32, 4, 0)),
		};
		em.addComponent(entity, new AnimationComponent(animations));
	});
};

Game.prototype.faceDirection = function(entity, dir) {
	this.em.getComponent(entity, DirectionComponent).value = dir;
};

Game.prototype.faceEachOther = function(entity1, entity2) {
	var em = this.em;
	var pos1 = em.getComponent(entity1, Position), pos2 = em.getComponent(entity2, Position);
	em.getComponent(entity1, DirectionComponent).value = direction.getDirectionToPos(pos1, pos2);
	em.getComponent(entity2, DirectionComponent).value = direction.getDirectionToPos(pos2, pos1);
};

/*audio.loadAudio("assets/masara-town.mp3", function(buffer) {
	var source = audio.playAudio(buffer);
	source.loop = true;
});*/

module.exports = Game;
