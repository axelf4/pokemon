import nano from "nano-ecs";
var texture = require("texture.js");
var NinePatch = require("NinePatch.js");
var Widget = require("Widget.js");
var player = require("player.js");
var resources = require("resources.js");
var Stack = require("Stack.js");
var Panel = require("Panel.js");
import Dialog from "Dialog";
var align = require("align.js");
import State from "State";
var WidgetGroup = require("WidgetGroup.js");
import * as input from "input";
import * as direction from "direction";
var Animation = require("Animation");
var glMatrix = require("gl-matrix");
import Select from "Select";
var renderer = require("renderer");
import range from "range";
import * as stateManager from "stateManager";
import TransitionState, {fade, createBattleTransition} from "TransitionState";
import {ListPokemonState} from "ListState";
var measureSpec = require("measureSpec");
import BattleState from "BattleState";
import { MovementSystem, Movement, LineOfSight,
	StillMovementController, WalkForwardMovementController } from "movement";
var lerp = require("lerp");

import Position from "Position";
import SpriteComponent from "SpriteComponent";
import Interactable from "Interactable";
import Animatable from "Animatable";
import Size from "Size";

const {mat4, vec3, quat} = glMatrix;
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

const showPauseMenu = async function(game) {
	game.lock();
	const selected = await new Promise((resolve, reject) => {
		game.widget.uiLayer.justify = Panel.ALIGN_FLEX_START;
		const optionNames = ["Pokemon", "Bag", "Save", "Exit"];
		const select = new Select(optionNames, 1, selected => {
			game.widget.uiLayer.justify = Panel.ALIGN_FLEX_END;
			game.widget.uiLayer.removeAllWidgets();
			resolve(selected);
		});
		select.style.align = align.END;
		game.widget.uiLayer.addWidget(select);
		select.requestFocus();
	});
	switch (selected) {
		case 0: // Pokemon
			const listState = new ListPokemonState(game.loader, game.playerTrainer.pokemon);
			await game.loader.all();
			stateManager.setState(listState);
			await new Promise(resolve => listState.setCloseCallback(resolve));
			stateManager.setState(game);
			break;
		case 1: // Bag
			break;
		case 2: // Save
			break;
		default:
			break;
	}
	game.release();
};

GameScreen.prototype.onKey = function(type, key) {
	if (this.flags & Widget.FLAG_FOCUSED) {
		if (type === input.KEY_ACTION_DOWN) {
			var game = this.game;
			var em = this.game.em;
			// Hacky way of connecting input to player interacting with shit
			let pos = game.player.position,
				movement = game.player.movement;
			if (!movement.isMoving && movement.getController() instanceof player.PlayerMovementController) {
				let playerDirection = game.player.directionComponent;
				switch (key) {
					case " ":
						let interactable = game.getEntityAtCell(pos.x + direction.getDeltaX(playerDirection.value),
								pos.y + direction.getDeltaY(playerDirection.value));
						if (interactable && interactable.hasComponent(Interactable)) {
							interactable.interactable.callback(game);
						}
						break;
					case "w": playerDirection.value = direction.UP; break;
					case "a": playerDirection.value = direction.LEFT; break;
					case "s": playerDirection.value = direction.DOWN; break;
					case "d": playerDirection.value = direction.RIGHT; break;
					case "Shift":
						showPauseMenu(game);
						break;
				}
			}
		}
	} else {
		Stack.prototype.onKey.call(this, type, key);
	}
};

var Game = function(loader, batch, playerTrainer) {
	State.call(this);
	this.loader = loader;
	this.batch = batch;
	this.playerTrainer = playerTrainer;

	this.widget = new GameScreen(this);
	this.widget.requestFocus();

	this.map = null;
	this.metaLayer = -1; // Index of meta layer or -1

	this.em = nano();
	this.movementSystem = new MovementSystem(this);

	this.updateHooks = [];
	this.pushTriggers = [];

	this.player = player.createPlayer(this, loader, this.em);
	this.battleTransition = null;
	createBattleTransition(loader).then(transition => {this.battleTransition = transition;});
};
Game.prototype = Object.create(State.prototype);
Game.prototype.constructor = Game;

const getEntityInterpPos = function(time, em, entity, pos, movement) {
	if (movement.isMoving) {
		let dir = entity.directionComponent.value,
			oldPos = direction.getPosInDirection(pos, direction.getReverse(dir)),
			t = movement.getInterpolationValue(time);
		return { x: lerp(oldPos.x, pos.x, t), y: lerp(oldPos.y, pos.y, t) };
	} else {
		return { x: pos.x, y: pos.y };
	}
};

const drawMapLayer = function(batch, map, layer) {
	const data = layer.data;
	let y = 0;
	for (let row = 0, rows = map.height; row < rows; ++row) {
		let x = 0;
		for (var col = 0, cols = map.width; col < cols; ++col) {
			var gid = data[col + row * map.width];
			if (gid !== 0) {
				const tileset = map.getTileSetByGid(gid);
				const x1 = x, y1 = y, x2 = x1 + map.tilewidth, y2 = y1 + map.tileheight;
				const sx = tileset.getTileX(gid), sy = tileset.getTileY(gid);
				const imageWidth = tileset.texture.width, imageHeight = tileset.texture.height;
				const u1 = sx / imageWidth, v1 = sy / imageHeight,
					u2 = (sx + tileset.tilewidth) / imageWidth, v2 = (sy + tileset.tileheight) / imageHeight;

				batch.draw(tileset.texture.texture, x1, y1, x2, y2, u1, v1, u2, v2);
			}

			x += map.tilewidth;
		}
		y += map.tileheight;
	}
};

const drawMapLayers = function(batch, map, layers) {
	for (let i = 0, length = layers.length; i < length; ++i) {
		const layer = map.layers[layers[i]];
		drawMapLayer(batch, map, layer);
	}
};

Game.prototype.draw = function(batch, dt, time) {
	const em = this.em, player = this.player;

	if (this.widget && this.widget.flags & Widget.FLAG_LAYOUT_REQUIRED) {
		var widthMeasureSpec = measureSpec.make(this.width, measureSpec.EXACTLY);
		var heightMeasureSpec = measureSpec.make(this.height, measureSpec.EXACTLY);

		this.widget.layout(widthMeasureSpec, heightMeasureSpec);
	}

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	const gbaAspectRatio = 3 / 2, virtualWidth = 400, virtualHeight = virtualWidth / gbaAspectRatio,
		scaleFactor = Math.ceil(Math.min(this.width / virtualWidth, this.height / virtualHeight));
	const playerInterpPos = getEntityInterpPos(time, em, player, player.position, player.movement);
	const transformX = this.width / 2 - 16 * scaleFactor * (playerInterpPos.x + 1 / 2),
		transformY = this.height / 2 - 16 * scaleFactor * (playerInterpPos.y + 1 / 2);

	vec3.set(positionVector, transformX, transformY, 0);
	mat4.fromRotationTranslationScale(mvMatrix, quat.create(), positionVector, vec3.fromValues(scaleFactor, scaleFactor, 1));
	var oldTransformMatrix = batch.getTransformMatrix();
	batch.setTransformMatrix(mvMatrix);
	batch.begin();

	drawMapLayers(batch, this.map, this.backgroundLayers);

	let entities = this.em.queryComponents([Position, SpriteComponent]);
	for (let entity of entities.sort((a, b) => a.position.y - b.position.y)) {
		const position = entity.position,
			spriteComponent = entity.spriteComponent,
			movement = entity.movement;

		var region;
		if (entity.hasComponent(Animatable)) {
			const dir = entity.directionComponent.value;
			const animation = entity.animatable.getAnimation(dir);
			region = movement && movement.isMoving ? animation.getFrame(time) : animation.getFrameByIndex(0);
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
		x = x + spriteComponent.offsetX;
		y = y + spriteComponent.offsetY;
		const width = region.width * spriteComponent.scale, height = region.height * spriteComponent.scale;
		batch.draw(texture.texture, x, y, x + width, y + height, u1, v1, u2, v2);
	}

	drawMapLayers(batch, this.map, this.foregroundLayers);

	batch.setTransformMatrix(oldTransformMatrix);
	this.widget.draw(batch, dt, time);
	batch.end();
};

Game.prototype.update = function(dt, time) {
	var em = this.em;
	this.movementSystem.update(dt, time);
	// Call all the registered update hooks
	for (var i = 0, length = this.updateHooks.length; i < length; ++i) {
		this.updateHooks[i](this, dt, em);
	}
};

Game.prototype.say = Game.prototype.showDialog = function(text) {
	return new Promise((resolve, reject) => {
		const dialog = new Dialog(text, resolve);
		dialog.style.height = 100;
		dialog.style.align = align.STRETCH;
		this.widget.uiLayer.addWidget(dialog);
		dialog.requestFocus();
	});
};

Game.prototype.multichoice = function(label, optionNames) {
	return new Promise((resolve, reject) => {
		var select = new Select(optionNames, 1, selected => {
			this.widget.uiLayer.removeAllWidgets();
			resolve(selected);
		});
		select.style.align = align.START;
		this.widget.uiLayer.addWidget(select);
		select.requestFocus();
		var dialog = new Dialog(label);
		dialog.style.align = align.STRETCH;
		dialog.style.height = 100;
		this.widget.uiLayer.addWidget(dialog);
	});
};

Game.prototype.getMap = function() { return this.map; };

Game.prototype.setMap = function(map, backgroundLayers, foregroundLayers) {
	this.map = map;
	var callback = function(item) {
		if (typeof item === "string" || item instanceof String) {
			return map.getLayerIdByName(item);
		} else if (typeof item === "number") {
			return item;
		}
		throw new TypeError("Unknown type of layer id.");
	};
	this.backgroundLayers = backgroundLayers.map(callback);
	this.foregroundLayers = foregroundLayers.map(callback);
	this.metaLayer = map.layers.findIndex(l => l.name === "meta");
};

Game.prototype.loadScript = async function(name) {
	const output = await this.loader.loadScript(name).then(script => script(this, this.loader));
	await this.loader.all();
	return output;
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
	entity.movement.pushController(new StillMovementController());
};

Game.prototype.release = function(entity) {
	if (!entity) entity = this.player;
	entity.movement.popController();
};

/**
 * Returns the entity at tile x,y or null if there is none.
 */
Game.prototype.getEntityAtCell = function(x, y) {
	let em = this.em;
	for (let entity of em.queryComponents([Position])) {
		let position = entity.position;
		let width = 1, height = 1;
		if (entity.hasComponent(Size)) {
			width = entity.size.width;
			height = entity.size.height;
		}
		if (position.x <= x && position.x + width > x
			&& position.y <= y && position.y + height > y)
			return entity;
	}
};

Game.prototype.isSolid = function(x, y) {
	// Can't walk outside map boundaries
	if (x < 0 || x >= this.map.width || y < 0 || y >= this.map.height) return true;
	// Check for entity at cell
	if (this.getEntityAtCell(x, y)) return true;
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
Game.prototype.warp = async function(x, y, mapScript) {
	let game;
	if (mapScript) {
		const transition = new TransitionState(this, fade);
		stateManager.setState(transition);
		game = new Game(this.loader, this.batch, this.playerTrainer);
		game.player.directionComponent.value =
			this.player.directionComponent.value;
		await game.loadScript(mapScript);
		transition.transitionTo(game);
	} else {
		game = this;
	}

	game.player.position.set(x, y);
};

Game.prototype.save = JSON.parse(window.localStorage.getItem("gameSave"));

Game.prototype.saveTheGame = function() {
	window.localStorage.setItem("gameSave", JSON.stringify(save));
};

Game.prototype.walkForward = function(entity) {
	return new Promise((resolve, reject) => {
		entity.movement.pushController(new WalkForwardMovementController(() => {
			movement.popController();
			resolve();
		}));
	});
};

/**
 * Returns the found entity or -1.
 */
Game.prototype.findEntityInLineOfSight = function(caster) {
	const em = this.em;
	const pos1 = caster.position;
	const dir = caster.directionComponent.value; // The direction of the line of sight
	const lOS = caster.lineOfSight;
	const dx = direction.getDeltaX(dir), dy = direction.getDeltaY(dir);

	for (let entity of em.queryComponents([Position])) {
		if (entity === caster) continue; // Cannot see itself
		const pos2 = entity.position;

		for (let step = 1, max = lOS.length; step <= max; ++step) {
			const x = pos1.x + step * dx, y = pos1.y + step * dy;

			if (pos2.x === x && pos2.y === y) return entity;

			// If the sight is obstructed: quit
			if (this.isSolid(x, y)) break;
		}
	}

	return -1;
};

Game.prototype.facePlayer = function(entity) {
	var em = this.em;
	var entityPos = entity.position;
	var playerPos = this.player.position;
	entity.directionComponent.value = direction.getDirectionToPos(entityPos, playerPos);
};

Game.prototype.walkPath = function(entity, path) {
	return new Promise((resolve, reject) => {
		var em = this.em;
		let movement = entity.movement;
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
	if (entity.hasComponent(Movement)) entity.movement.snap();
};

Game.prototype.loadCharacterSprite = function(entity, url) {
	return this.loader.loadTexture(url).then(textureRegion => {
		var em = this.em;
		entity.addComponent(SpriteComponent, textureRegion);
		let spriteComponent = entity.spriteComponent;
		spriteComponent.offsetX = -8;
		spriteComponent.offsetY = -16;
		var animations = {
			down: new Animation(250, Animation.getSheetFromTexture(4, 0, 0, 32, 32, 4, 0)),
			up: new Animation(250, Animation.getSheetFromTexture(4, 0, 32, 32, 32, 4, 0)),
			left: new Animation(250, Animation.getSheetFromTexture(4, 0, 64, 32, 32, 4, 0)),
			right: new Animation(250, Animation.getSheetFromTexture(4, 0, 96, 32, 32, 4, 0)),
		};
		entity.addComponent(Animatable, animations);
	});
};

Game.prototype.faceDirection = function(entity, dir) {
	entity.directionComponent.value = dir;
};

Game.prototype.faceEachOther = function(entity1, entity2) {
	var em = this.em;
	var pos1 = entity1.position, pos2 = entity2.position;
	entity1.directionComponent.value = direction.getDirectionToPos(pos1, pos2);
	entity2.directionComponent.value = direction.getDirectionToPos(pos2, pos1);
};

Game.prototype.battle = async function(enemyTrainer) {
	const loader = this.loader;
	const transition = new TransitionState(this, this.battleTransition);
	stateManager.setState(transition);
	const battleState = new BattleState(loader, this, this.playerTrainer, enemyTrainer);
	await loader.all();
	transition.transitionTo(battleState);
};

/*audio.loadAudio("assets/masara-town.mp3", function(buffer) {
	var source = audio.playAudio(buffer);
	source.loop = true;
});*/

export default Game;
