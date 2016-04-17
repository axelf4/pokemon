var glMatrix = require("gl-matrix");
var lerp = require("lerp");
var BitSet = require("bitset");
var fowl = require("fowl");
var renderer = require("renderer.js");
var SpriteBatch = require("SpriteBatch.js");
var sign = require("sign.js");
var LoadingManager = require("LoadingManager.js");
var Map = require("map.js");
var Animation = require("Animation.js");
var NinePatch = require("NinePatch.js");
var audio = require("Audio.js");
var Font = require("font.js");
var flex = require("flex.js");
var gui = require("gui.js");
var input = require("input.js");
var texture = require("texture.js");

var DialogueBox = require("DialogueBox.js");
var Position = require("Position.js");
var Direction = require("Direction.js");
var SpriteComponent = require("SpriteComponent.js");
var PlayerComponent = require("PlayerComponent.js");
var InteractionComponent = require("InteractionComponent.js");
var OldPosition = require("OldPosition.js");
var MovementComponent = require("MovementComponent.js");

var gl = renderer.gl;
var vec3 = glMatrix.vec3;
var mat4 = glMatrix.mat4;

console.log("----- Starting the game lol -----");

var spriteBatch = new SpriteBatch();

var projectionMatrix = mat4.create();
mat4.ortho(projectionMatrix, 0, 640, 480, 0, -1, 1);
var mvMatrix = mat4.create();
mat4.identity(mvMatrix);
var translation = vec3.create();
// vec3.set(translation, 0, 0, -6);
mat4.translate(mvMatrix, mvMatrix, translation);

var manager = new LoadingManager();

var font = new Font(manager);

fowl.registerComponents(
		Position,
		Direction,
		SpriteComponent,
		PlayerComponent,
		InteractionComponent,
		OldPosition,
		MovementComponent
		);
var em = new fowl.EntityManager();

var flexLayout = new flex.FlexLayout();
var container = {
	style: {
		direction: flex.DIRECTION_COLUMN,
		justifyContent: flex.ALIGN_FLEX_END
	},
	manager: flexLayout,
	children: []
};

var dialogue;
var showDialogue = (function() {
	var ninePatchTexture, ninePatch;
	manager.loadFile("textures/frame.9.png", function(file) {
		ninePatchTexture = new texture.Region();
		ninePatchTexture.loadFromFile(manager, file, function() {
			ninePatch = NinePatch.fromTexture(ninePatchTexture.texture, 24, 24);
		});
	});
	return function(text) {
		return new Promise(function(resolve, reject) {
			var callback = function() { resolve(); };
			dialogue = new DialogueBox.DialogueBox(ninePatchTexture, ninePatch, font, text, callback);
			dialogue.style = {};
			dialogue.style.width = 640;
			dialogue.style.height = 100;
			dialogue.style.align = flex.ALIGN_FLEX_END;

			gui.addWidgetToParent(container, dialogue);
		});
	};
})();

var map;
var updateHooks = [];

var context = {
	em: em,
	getMap: function() { return map; },
	setMap: function(value) {
		map = value;
	},
	getEntityAtCell: function(em, x, y) {
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
	},
	loadScript: function(name) {
		window.cancelAnimationFrame(requestID);
		require(["./scripts/" + name], function(script) {
			script(manager, context);
		});
	},
	addUpdateHook: function(hook) {
		updateHooks.push(hook);
	},
	removeUpdateHook: function(hook) {
		var idx = updateHooks.indexOf(hook);
		updateHooks.splice(idx, 1);
	},
	getContainer: function() { return container; },
	getDialogue: function() { return dialogue; },
	showDialogue: showDialogue,
	advanceOrHideDialogue: function() {
		gui.removeWidgetFromParent(container, dialogue);
		if (dialogue.callback) dialogue.callback(); // Resolve the promise
		dialogue = null;
		return true;
	},
	isSolid: function(x, y) {
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
				layer = map.layers[i];
				break;
			}
		}
		return layer.data[x + map.mapWidth * y];
	},
	isTileSolid: function(x, y) {
		var layer;
		for (var i = 0, length = map.layers.length; i < length; i++) {
			if (map.layers[i].name === "meta") {
				layer = map.layers[i];
				break;
			}
		}
		if (!layer) console.error("No meta layer!");
		return layer.data[x + map.mapWidth * y];
	},
	pushTriggers: [],
	clearLevel: function() {
		this.pushTriggers = [];
	},
	player: null,
	save: JSON.parse(window.localStorage.getItem("gameSave")),
	saveTheGame: function() {
		window.localStorage.setItem("gameSave", JSON.stringify(save));
	},
};

context.loadScript("movement.js");
context.loadScript("player.js");
context.loadScript("forest.js");

audio.loadAudio(manager, "assets/masara-town.mp3", function(buffer) {
	var source = audio.playAudio(buffer);
	source.loop = true;
});

var mapRenderer = null;

var lastTime = performance.now();
var time = 0;
var requestID;
var update = function(timestamp) {
	requestID = window.requestAnimationFrame(update);
	var dt = timestamp - lastTime;
	lastTime = timestamp;
	time += dt;

	gl.clear(gl.COLOR_BUFFER_BIT);

	spriteBatch.projectionMatrix = projectionMatrix;
	spriteBatch.mvMatrix = mvMatrix;

	if (!mapRenderer) {
		mapRenderer = new Map.MapRenderer(map);
	} else {
		mapRenderer.draw();
	}
	// map.drawLayer(spriteBatch, map.layers[0]);
	// map.drawLayer(spriteBatch, map.layers[1]);

	var mask = fowl.getMask([Position, OldPosition, SpriteComponent, MovementComponent]);
	for (var entity = 0, length = em.count; entity < length; entity++) {
		if (em.matches(entity, mask)) {
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

	gui.prepareNode(container);
	container.width = 640;
	container.height = 480;
	if (container.dirty) container.manager.layout(container);
	for (var i = 0; i < container.children.length; i++) {
		container.children[i].draw(spriteBatch);
	}

	spriteBatch.flush();

	/*var error = gl.getError();
	if (error !== gl.NO_ERROR && error !== gl.CONTEXT_LOST_WEBGL) {
		console.error("OpenGL error.");
	}*/

	if (input.pressedKeys.indexOf(32) !== -1) {
		if (context.getDialogue()) {
			context.advanceOrHideDialogue();
		} else {
			// Player interacting with shit
			var pos = em.getComponent(context.player, Position);
			var direction = em.getComponent(context.player, Direction);
			var entity = context.getEntityAtCell(em, pos.x + direction.getDeltaX(), pos.y + direction.getDeltaY());
			if (entity !== null) {
				var interactable = em.getComponent(entity, InteractionComponent);
				if (interactable) interactable.callback(context);
			}
		}
	}

	// Call all the registered update hooks
	for (var i = 0, length = updateHooks.length; i < length; i++) {
		updateHooks[i](dt, em, context);
	}

	input.pressedKeys.length = 0;
};
manager.onload = function() {
	window.requestAnimationFrame(update);
};
manager.startLoading();
