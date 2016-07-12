var glMatrix = require("gl-matrix");
var renderer = require("renderer.js");
var SpriteBatch = require("SpriteBatch.js");
var FileLoader = require("FileLoader");
var LoaderFacade = require("LoaderFacade");
var input = require("input.js");
var stateManager = require("stateManager.js");
var promiseProxy = require("promiseProxy");
var cachingProxy = require("cachingProxy");
var resources = require("resources");
var Font = require("font.js");
var NinePatch = require("NinePatch");
var LoadingScreen = require("LoadingScreen.js");
var BattleState = require("BattleState.js");
var Game = require("Game.js");
// require("babel-core/register");
// require("babel-polyfill");

var Position = require("Position");
var OldPosition = require("OldPosition");
var MovementComponent = require("MovementComponent");
var lerp = require("lerp");

var Trainer = require("Trainer.js");
var pokemon = require("pokemon.js");
var move = require("move.js");

var gl = renderer.gl;
var vec3 = glMatrix.vec3;
var mat4 = glMatrix.mat4;

console.log("----- Starting the game -----");

var projectionMatrix = mat4.create();
mat4.ortho(projectionMatrix, 0, 640, 480, 0, -1, 1);

var batch = new SpriteBatch();
batch.setProjectionMatrix(projectionMatrix);
// batch.setTransformMatrix(mvMatrix);

var fileLoader = new FileLoader("pokemongame");
var loaderFacade = new LoaderFacade(fileLoader);
var loader = cachingProxy(loaderFacade);

input.setListener((type, key) => {
	stateManager.getState().onKey(type, key);
});

var loadingScreen = new LoadingScreen();
stateManager.setState(loadingScreen);

var proxyLoader = promiseProxy(loader);

resources.font = new Font(proxyLoader);
loader.loadTextureRegion("textures/frame.9.png").then(textureRegion => {
	resources.frame = NinePatch.fromTexture(textureRegion.texture, 24, 24);
});

var game = new Game(proxyLoader, batch);
game.loadScript("home.js");
game.warp(9, 3);

proxyLoader.all.then(() => {
	console.log("Loaded all assets for Game. Switching states...");
	stateManager.setState(game);
}, () => {
	console.log("Some asset was rejected.");
});

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

var lastTime = (performance || Date).now();
var requestID;

var update = function(timestamp) {
	requestID = window.requestAnimationFrame(update);
	var dt = timestamp - lastTime;
	if (dt > 1000) dt = 0; // If the user comes back to the tab after a large amount of time
	lastTime = timestamp;

	var state = stateManager.getState();
	state.update(dt, timestamp);

	var resized = renderer.sizeCanvas();
	var width = renderer.getWidth(), height = renderer.getHeight();
	if (resized) {
		// mat4.ortho(projectionMatrix, -width / 2, width / 2, -height / 2, height / 2, -1, 1);
		mat4.ortho(projectionMatrix, 0, width, height, 0, -1, 1);
		batch.setProjectionMatrix(projectionMatrix);

		state.resize(width, height);
	}

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	state.draw(batch, dt, timestamp);

	/*var error = gl.getError();
	if (error !== gl.NO_ERROR && error !== gl.CONTEXT_LOST_WEBGL) {
		console.error("OpenGL error.");
	}*/
};

window.requestAnimationFrame(update);
