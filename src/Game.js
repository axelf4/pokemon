var fowl = require("fowl");
var lerp = require("lerp");
var loader = require("loader.js");
var texture = require("texture.js");
var NinePatch = require("NinePatch.js");
var audio = require("Audio.js");
var Map = require("map.js");
var Widget = require("Widget.js");
var Font = require("font.js");
var flex = require("flex.js");
var gui = require("gui.js");
var container = require("container.js");
var playerFactory = require("playerFactory.js");
var StillMovementController = require("StillMovementController.js");
var Dialog = require("Dialog.js");

var Position = require("Position.js");
var Direction = require("Direction.js");
var SpriteComponent = require("SpriteComponent.js");
var PlayerComponent = require("PlayerComponent.js");
var InteractionComponent = require("InteractionComponent.js");
var OldPosition = require("OldPosition.js");
var MovementComponent = require("MovementComponent.js");

var font = new Font();

var dialogue;
var showDialogue = function(text) {
	return new Promise(function(resolve, reject) {
		var callback = function() { resolve(); };
		dialog = new Dialog(text, callback);
		dialog.style = {};
		dialog.style.width = 640;
		dialog.style.height = 100;
		dialog.style.align = flex.ALIGN_FLEX_END;

		container.addWidget(dialog);
	});
};

exports.say = showDialogue;
exports.showDialogue = showDialogue;

fowl.registerComponents(
		Position,
		Direction,
		SpriteComponent,
		PlayerComponent,
		InteractionComponent,
		OldPosition,
		MovementComponent);
var em = exports.em = new fowl.EntityManager();

var updateHooks = [];
var map, mapRenderer;
var foregroundRenderList, backgroundRenderList;

exports.getMap = function() { return map; };

var setMap = exports.setMap = function(value, backgroundLayers, foregroundLayers) {
	map = value;
	mapRenderer = new Map.MapRenderer(map);
	var callback = function(item) {
		if (typeof item === "string" || item instanceof String) {
			return Map.getLayerIdByName(map, item);
		}
		throw new Error("Unknown type of layer id");
	};
	backgroundLayers = backgroundLayers.map(callback);
	foregroundLayers = foregroundLayers.map(callback);
	backgroundRenderList = mapRenderer.getRenderList(backgroundLayers);
	foregroundRenderList = mapRenderer.getRenderList(foregroundLayers);
};

exports.getEntityAtCell = function(em, x, y) {
	var result = null;
	var mask = fowl.getMask([Position]);
	for (var entity = 0, length = em.count; entity < length; entity++) {
		if (em.matches(entity, mask)) {
			var position = em.getComponent(entity, Position);
			if (position.x === x && position.y === y) {
				result = entity;
			}
		}
	}
	return result;
};

var loadScript = exports.loadScript = function(name) {
	require(["./scripts/" + name], function(script) {
		script();
	});
};

exports.addUpdateHook = function(hook) {
	updateHooks.push(hook);
};

exports.removeUpdateHook = function(hook) {
	var idx = updateHooks.indexOf(hook);
	updateHooks.splice(idx, 1);
};

var player = playerFactory.createPlayer(em);
exports.getPlayer = function() { return player; }

exports.lock = function() {
	var playerMovement = em.getComponent(player, MovementComponent);
	playerMovement.pushController(new StillMovementController());
};

exports.release = function() {
	var playerMovement = em.getComponent(player, MovementComponent);
	playerMovement.popController();
};

exports.advanceOrHideDialogue = function() {
	gui.removeWidgetFromParent(container, dialogue);
	if (dialogue.callback) dialogue.callback(); // Resolve the promise
	dialogue = null;
	return true;
};

exports.isSolid = function(x, y) {
	// Check for entity at cell
	var mask = fowl.getMask([Position]);
	for (var entity = 0, length = this.em.count; entity < length; entity++) {
		if (em.matches(entity, mask)) {
			var position = em.getComponent(entity, Position);
			if (position.x === x && position.y === y) return true;
		}
	}
	// Check for collidable tile at cell
	var layer;
	for (var i = 0, length = map.layers.length; i < length; i++) {
		if (map.layers[i].name === "meta") {
			return map.layers[i].data[x + map.width * y];
		}
	}
	throw new Error("Current map has no meta layer.");
};

exports.pushTriggers = [];

exports.clearLevel = function() {
	this.pushTriggers = [];
};

exports.save = JSON.parse(window.localStorage.getItem("gameSave"));

exports.saveTheGame = function() {
	window.localStorage.setItem("gameSave", JSON.stringify(save));
};

exports.wait = function(ms) {
	return new Promise(function(resolve, reject) {
		window.setTimeout(function() {
			resolve();
		}, ms);
	});
};

loadScript("movement.js");
loadScript("forest.js");

audio.loadAudio("assets/masara-town.mp3", function(buffer) {
	var source = audio.playAudio(buffer);
	source.loop = true;
});

var GameFrame = exports.GameFrame = function() {
	Widget.call(this);
};
GameFrame.prototype = Object.create(Widget.prototype);
GameFrame.prototype.constructor = GameFrame;

var mapRenderer = null;
var spriteSystemMask = fowl.getMask([Position, OldPosition, SpriteComponent, MovementComponent]);

GameFrame.prototype.update = function(dt, time, spriteBatch) {
	mapRenderer.draw(backgroundRenderList);

	for (var entity = 0, length = em.count; entity < length; entity++) {
		if (em.matches(entity, spriteSystemMask)) {
			var position = pos = em.getComponent(entity, Position);
			var oldpos = em.getComponent(entity, OldPosition);
			var spriteComponent = em.getComponent(entity, SpriteComponent);
			var movement = em.getComponent(entity, MovementComponent);

			var texture = spriteComponent.texture;
			var region = spriteComponent.animation.getFrame(time);
			var u1 = (region.x + 0.5) / texture.width;
			var v1 = (region.y + 0.5) / texture.height;
			var u2 = (region.x + region.width - 0.5) / texture.width;
			var v2 = (region.y + region.height - 0.5) / texture.height;
			var x = lerp(oldpos.x, pos.x, movement.timer / movement.delay) * 16 + spriteComponent.offsetX;
			var y = lerp(oldpos.y, pos.y, movement.timer / movement.delay) * 16 + spriteComponent.offsetY;
			var width = region.width * spriteComponent.scale, height = region.height * spriteComponent.scale;
			spriteBatch.draw(texture.texture, x, y, x + width, y + height, u1, v1, u2, v2);
		}
	}

	mapRenderer.draw(foregroundRenderList);

	// Call all the registered update hooks
	for (var i = 0, length = updateHooks.length; i < length; i++) {
		updateHooks[i](dt, em);
	}
};
