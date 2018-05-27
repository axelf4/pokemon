var fowl = require("fowl");
var lerp = require("lerp");
var texture = require("texture.js");
var NinePatch = require("NinePatch.js");
var Map = require("map.js");
var MapRenderer = require("OrthogonalMapRenderer.js");
// var CachedMapRenderer = require("CachedMapRenderer.js");
var Widget = require("Widget.js");
var player = require("player.js");
var StillMovementController = require("StillMovementController.js");
var resources = require("resources.js");
var Stack = require("Stack.js");
var Panel = require("Panel.js");
var Dialog = require("Dialog.js");
var align = require("align.js");
import { MovementSystem, MovementComponent } from "movement";
import State from "State";
var WidgetGroup = require("WidgetGroup.js");
var input = require("input.js");
var direction = require("direction");
var WalkForwardMovementController = require("WalkForwardMovementController");
var PathMovementController = require("PathMovementController");
var Animation = require("Animation");
var glMatrix = require("gl-matrix");
var Select = require("Select");
var renderer = require("renderer");
import range from "range";

var Position = require("Position.js");
var DirectionComponent = require("DirectionComponent.js");
var SpriteComponent = require("SpriteComponent.js");
var InteractionComponent = require("InteractionComponent.js");
var LineOfSightComponent = require("LineOfSightComponent");
var AnimationComponent = require("AnimationComponent");
var DimensionComponent = require("DimensionComponent");

var mat4 = glMatrix.mat4;
var vec3 = glMatrix.vec3;
var gl = renderer.gl;

var font = resources.font;

var mvMatrix = mat4.create();
var positionVector = vec3.create();
const up = vec3.fromValues(0, 1, 0);
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

const getEntityInterpPos = function(time, em, entity, pos, mov) {
	if (mov.isMoving()) {
		const dir = em.getComponent(entity, DirectionComponent).value;
		const oldPos = direction.getPosInDirection(pos, direction.getReverse(dir)),
			t = mov.getInterpolationValue(time);
		return { x: lerp(oldPos.x, pos.x, t), y: lerp(oldPos.y, pos.y, t) };
	} else {
		return { x: pos.x, y: pos.y };
	}
};

GameScreen.prototype.draw = function(batch, dt, time) {
	const game = this.game, em = game.em, player = game.player;

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	const playerInterpPos = getEntityInterpPos(time, em, player,
			em.getComponent(player, Position), em.getComponent(player, MovementComponent));
	const transformX = Math.ceil(playerInterpPos.x * 16 - this.width / 2),
		transformY = Math.ceil(playerInterpPos.y * 16 - this.height / 2);

	// game.mapRenderer.drawLayers(game.backgroundLayers, transformX, transformY, this.width, this.height);

	vec3.set(positionVector, -transformX, -transformY, 0);
	mat4.fromTranslation(mvMatrix, positionVector);
	var oldTransformMatrix = batch.getTransformMatrix();
	batch.setTransformMatrix(mvMatrix);

	batch.begin();

	game.mapRenderer.drawLayers(game.backgroundLayers);

	range(em.count).filter(entity => em.matches(entity, game.spriteSystemMask))
		.sort((a, b) => em.getComponent(a, Position).y - em.getComponent(b, Position).y)
		.forEach(entity => {
			const position = em.getComponent(entity, Position),
				spriteComponent = em.getComponent(entity, SpriteComponent),
				movement = em.hasComponent(entity, MovementComponent) ? em.getComponent(entity, MovementComponent) : null;

			var region;
			if (em.hasComponent(entity, AnimationComponent)) {
				const dir = em.getComponent(entity, DirectionComponent).value;
				const animation = em.getComponent(entity, AnimationComponent).getAnimation(dir);
				region = movement && movement.isMoving() ? animation.getFrame(time) : animation.getFrameByIndex(0);
			} else {
				region = spriteComponent.animation ? spriteComponent.animation.getFrame(time)
					: spriteComponent.region;
			}

			const texture = spriteComponent.texture;
			const u1 = region.x / texture.width, v1 = region.y / texture.height,
				u2 = (region.x + region.width) / texture.width, v2 = (region.y + region.height) / texture.height;

			let x, y;
			if (movement) {
				const interpPos = getEntityInterpPos(time, em, entity, position, movement);
				x = interpPos.x * 16;
				y = interpPos.y * 16;
			} else {
				x = position.x * 16;
				y = position.y * 16;
			}
			x = Math.ceil(x + spriteComponent.offsetX);
			y = Math.ceil(y + spriteComponent.offsetY);
			const width = region.width * spriteComponent.scale, height = region.height * spriteComponent.scale;
			batch.draw(texture.texture, x, y, x + width, y + height, u1, v1, u2, v2);
		});
	// batch.end();

	// game.mapRenderer.drawLayers(game.foregroundLayers, transformX, transformY, this.width, this.height);
	game.mapRenderer.drawLayers(game.foregroundLayers);

	batch.setTransformMatrix(oldTransformMatrix);

	// batch.begin();
	Stack.prototype.draw.call(this, batch, dt, time);
	batch.end();
};

GameScreen.prototype.onKey = function(type, key) {
	if (this.flags & Widget.FLAG_FOCUSED) {
		if (type === input.KEY_ACTION_DOWN) {
			var game = this.game;
			var em = this.game.em;
			// Hacky way of connecting input to player interacting with shit
			var pos = em.getComponent(game.player, Position);
			var movement = em.getComponent(game.player, MovementComponent);
			if (!movement.isMoving() && movement.getController() instanceof player.PlayerMovementController) {
				var playerDirection = em.getComponent(game.player, DirectionComponent);
				switch (key) {
					case " ":
						var interactable = game.getEntityAtCell(pos.x + direction.getDeltaX(playerDirection.value),
								pos.y + direction.getDeltaY(playerDirection.value));
						if (interactable !== null) {
							var interaction = em.getComponent(interactable, InteractionComponent);
							if (interaction) interaction.callback(game);
						}
						break;
					case "w": playerDirection.value = direction.UP; break;
					case "a": playerDirection.value = direction.LEFT; break;
					case "s": playerDirection.value = direction.DOWN; break;
					case "d": playerDirection.value = direction.RIGHT; break;
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
	this.mapRenderer = new MapRenderer(map, this.batch);
	// this.mapRenderer = new CachedMapRenderer(map);
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
	if (relative) {
		pos.x = pos.x - x;
		pos.y = pos.y - y;
	} else {
		pos.x = x;
		pos.y = y;
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
	const em = this.em;
	const pos1 = em.getComponent(caster, Position);
	const dir = em.getComponent(caster, DirectionComponent).value; // The direction of the line of sight
	const LoS = em.getComponent(caster, LineOfSightComponent); // LoS
	const dx = direction.getDeltaX(dir), dy = direction.getDeltaY(dir);

	for (var entity = 0, length = em.count; entity < length; ++entity) {
		if (entity !== caster /* Can't see itself! */
				&& em.matches(entity, this.collisionMask)) {
			const pos2 = em.getComponent(entity, Position);

			for (let step = 1, max = LoS.length; step <= max; ++step) {
				const x = pos1.x + step * dx, y = pos1.y + step * dy;

				if (pos2.x === x && pos2.y === y) return entity;

				// If the sight is obstructed: quit
				if (this.isSolid(x, y)) break;
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
 */
Game.prototype.snapEntity = function(entity) {
	var em = this.em;
	if (em.hasComponent(entity, MovementComponent)) em.getComponent(entity, MovementComponent).snap();
};

Game.prototype.loadCharacterSprite = function(entity, url) {
	return this.loader.loadTexture(url).then(textureRegion => {
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
