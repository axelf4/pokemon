import nano from "nano-ecs";
var Widget = require("Widget.js");
var player = require("player.js");
var resources = require("resources.js");
import Stack from "Stack";
import Panel from "Panel";
import Dialog from "Dialog";
var align = require("align.js");
import State from "State";
import {FOCUS_AFTER_DESCENDANTS} from "WidgetGroup";
import * as input from "input";
import Direction, * as direction from "direction";
var Animation = require("Animation");
import {mat4, vec3, quat} from "gl-matrix";
import Select from "Select";
var renderer = require("renderer");
import range from "range";
import * as stateManager from "stateManager";
import TransitionState, {fade, createBattleTransition} from "TransitionState";
import {listPokemon, listItems} from "ListState";
var measureSpec = require("measureSpec");
import BattleState from "BattleState";
import { MovementSystem, Movement, LineOfSight,
	StillMovementController, WalkForwardMovementController,
	PathMovementController } from "movement";
var lerp = require("lerp");

import Position from "Position";
import SpriteComponent from "SpriteComponent";
import Interactable from "Interactable";
import Size from "Size";

var gl = renderer.gl;
const mvMatrix = mat4.create(),
	positionVector = vec3.create();
var font = resources.font;

class GameScreen extends Stack {
	constructor(game) {
		super();
		this.game = game;
		this.setFocusable(true);
		this.setDescendantFocusability(FOCUS_AFTER_DESCENDANTS);

		this.uiLayer = new Panel();
		this.uiLayer.justify = Panel.ALIGN_FLEX_END;
		this.uiLayer.direction = Panel.DIRECTION_COLUMN;
		this.addWidget(this.uiLayer);
	}

	onKey(type, key) {
		if (this.flags & Widget.FLAG_FOCUSED) {
			if (type === input.KEY_ACTION_DOWN) {
				var game = this.game;
				var em = this.game.em;
				// Hacky way of connecting input to player interacting with shit
				let pos = game.player.position,
					movement = game.player.movement;
				if (!movement.isMoving && movement.controller instanceof player.PlayerMovementController) {
					let playerDirection = game.player.directionComponent;
					switch (key) {
						case " ":
							let interactable = game.getEntityAtCell(pos.x + direction.getDeltaX(playerDirection.value),
								pos.y + direction.getDeltaY(playerDirection.value));
							if (interactable && interactable.hasComponent(Interactable)) {
								interactable.interactable.callback(game);
							}
							break;
						case "w": playerDirection.value = Direction.Up; break;
						case "a": playerDirection.value = Direction.Left; break;
						case "s": playerDirection.value = Direction.Down; break;
						case "d": playerDirection.value = Direction.Right; break;
						case "Shift":
							showPauseMenu(game);
							break;
					}
				}
			}
		} else super.onKey(type, key);
	}
}

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
			await listPokemon(game.loader, game.playerTrainer);
			break;
		case 1: // Bag
			await listItems(game.loader, game.playerTrainer);
			break;
		case 2: // Save
			break;
		default:
			break;
	}
	game.release();
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

const getEntityInterpPos = function(time, entity, pos, movement) {
	if (movement.isMoving) {
		let dir = entity.directionComponent.value,
			oldPos = direction.getPosInDirection(pos, direction.getReverse(dir)),
			t = movement.getInterpolationValue(time);
		return { x: lerp(oldPos.x, pos.x, t), y: lerp(oldPos.y, pos.y, t) };
	} else {
		return { x: pos.x, y: pos.y };
	}
};

function drawMapLayers(batch, map, layers) {
	for (let i = 0, length = layers.length; i < length; ++i) {
		const layer = map.layers[layers[i]];
		map.drawLayer(batch, layer);
	}
}

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
	const playerInterpPos = getEntityInterpPos(time, player, player.position, player.movement);
	const transformX = this.width / 2 - 16 * scaleFactor * (playerInterpPos.x + 1 / 2),
		transformY = this.height / 2 - 16 * scaleFactor * (playerInterpPos.y + 1 / 2);

	vec3.set(positionVector, transformX, transformY, 0);
	mat4.fromRotationTranslationScale(mvMatrix, quat.create(), positionVector, vec3.fromValues(scaleFactor, scaleFactor, 1));
	let oldTransformMatrix = batch.getTransformMatrix();
	batch.setTransformMatrix(mvMatrix);
	batch.begin();

	drawMapLayers(batch, this.map, this.backgroundLayers);

	let entities = this.em.queryComponents([Position, SpriteComponent]);
	for (let entity of entities.sort((a, b) => a.position.y - b.position.y)) {
		const position = entity.position,
			spriteComponent = entity.spriteComponent,
			movement = entity.movement;

		let texRegion;
		if (spriteComponent.animations) {
			const dir = entity.directionComponent.value;
			const animation = spriteComponent.getAnimation(dir);
			texRegion = movement?.isMoving ? animation.getFrame(time) : animation.frames[0];
		} else {
			texRegion = spriteComponent.texRegion;
		}

		let pos = movement ? getEntityInterpPos(time, entity, position, movement) : position;
		let x = 16 * pos.x + spriteComponent.offsetX,
			y = 16 * pos.y + spriteComponent.offsetY;
		let {width, height} = texRegion.getSize();
		texRegion.draw(batch, x, y, x + width, y + height);
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

Game.prototype.isTileSolid = function(x, y) {
	// Can't walk outside map boundaries
	if (x < 0 || x >= this.map.width || y < 0 || y >= this.map.height) return true;
	// Check for collidable tile at cell
	var map = this.map, metaLayer = this.metaLayer;
	if (metaLayer !== -1) return map.layers[metaLayer].data[x + map.width * y];
	throw new Error("Current map has no meta layer.");
}

Game.prototype.isSolid = function(x, y) {
	return this.isTileSolid(x, y) || !!this.getEntityAtCell(x, y);
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
	return this.loader.load(url).then(texRegion => {
		const em = this.em;

		let tiles = texRegion.split(32, 32);
		let animations = {
			down: new Animation(250, tiles[0]),
			up: new Animation(250, tiles[1]),
			left: new Animation(250, tiles[2]),
			right: new Animation(250, tiles[3]),
		};

		entity.addComponent(SpriteComponent, texRegion, animations);
		let spriteComponent = entity.spriteComponent;
		spriteComponent.offsetX = -8;
		spriteComponent.offsetY = -16;
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
