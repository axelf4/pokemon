var glMatrix = require("gl-matrix");
var renderer = require("renderer.js");
var SpriteBatch = require("SpriteBatch.js");
import FileLoader from "FileLoader";
var LoaderFacade = require("LoaderFacade");
var input = require("input.js");
import * as stateManager from "stateManager";
import promiseProxy from "promiseProxy";
import cachingProxy from "cachingProxy";
var resources = require("resources");
var Font = require("font.js");
var NinePatch = require("NinePatch");
import LoadingScreen from "LoadingScreen";
// var BattleState = require("BattleState.js");
var Game = require("Game.js");
import TransitionState from "TransitionState";
var fowl = require("fowl");

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

import Trainer from "Trainer";
var pokemon = require("pokemon.js");
var move = require("move.js");

var gl = renderer.gl;
var vec3 = glMatrix.vec3;
var mat4 = glMatrix.mat4;

console.log("----- Starting the game -----");

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

var projectionMatrix = mat4.create();

var batch = new SpriteBatch();

input.setListener((type, key) => {
	stateManager.getState().onKey(type, key);
});

var fileLoader = new FileLoader("pokemongame");
var loaderFacade = new LoaderFacade(fileLoader);
var loader = promiseProxy(cachingProxy(loaderFacade));

// var loadingScreen = new LoadingScreen();
let transitionState = new TransitionState();
stateManager.setState(transitionState);

resources.font = new Font(loader);
loader.loadTextureRegion("textures/frame.9.png").then(textureRegion => {
	resources.frame = NinePatch.fromTexture(textureRegion.texture, 24, 24);
});

var game = new Game(loader, batch);
game.loadScript("home.js");
game.warp(9, 3);

var slowpoke = {
	name: "Slowpoke",
	moves: [move.TACKLE, move.FLAMETHROWER, move.HYDROPUMP, move.PURSUIT],
	hp: 90,
	maxHp: 90,
	attack: 65,
	defense: 65,
	speed: 15,
	level: 1,
};
// Based off Oddish
var snoopDogg = {
	name: "Snoop Dogg",
	moves: [move.TACKLE],
	hp: 45,
	maxHp: 45,
	attack: 50,
	defense: 55,
	speed: 30,
	level: 1,
};

var playerTrainer = new Trainer("Axel", [slowpoke]);
var enemyTrainer = new Trainer("Fucker", [snoopDogg]);
// var battleState = new BattleState(game, playerTrainer, enemyTrainer);

loader.all.then(() => {
	console.log("Loaded initial assets.");
	transitionState.transitionTo(game);
	// stateManager.setState(game);
}, () => {
	console.log("Some asset was rejected.");
});

var requestID, lastTime = (performance || Date).now();

var update = function(timestamp) {
	requestID = window.requestAnimationFrame(update);
	var dt = timestamp - lastTime;
	if (dt > 1000) dt = 0; // If the user comes back to the tab after a large amount of time
	lastTime = timestamp;

	var state = stateManager.getState();
	state.update(dt, timestamp);

	var resized = renderer.sizeCanvas();
	if (resized) {
		var width = renderer.getWidth(), height = renderer.getHeight();
		mat4.ortho(projectionMatrix, 0, width, height, 0, -1, 1);
		batch.setProjectionMatrix(projectionMatrix);

		state.resize(width, height);
	}

	state.draw(batch, dt, timestamp);

	/*var error = gl.getError();
	if (error !== gl.NO_ERROR && error !== gl.CONTEXT_LOST_WEBGL) {
		console.error("OpenGL error.");
	}*/
};

window.requestAnimationFrame(update);
