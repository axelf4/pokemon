var glMatrix = require("gl-matrix");
var renderer = require("renderer.js");
var SpriteBatch = require("SpriteBatch.js");
var LoadingManager = require("LoadingManager.js");
var input = require("input.js");
var loader = require("loader.js");
var root = require("root.js");
var stateManager = require("stateManager.js");
var LoadingScreen = require("LoadingScreen.js");
var BattleState = require("BattleState.js");
var Widget = require("Widget.js");
var Game = require("Game.js");

var Trainer = require("Trainer.js");
var pokemon = require("pokemon.js");
var move = require("move.js");

var gl = renderer.gl;
var vec3 = glMatrix.vec3;
var mat4 = glMatrix.mat4;

console.log("----- Starting the game -----");

var projectionMatrix = mat4.create();
mat4.ortho(projectionMatrix, 0, 640, 480, 0, -1, 1);
var mvMatrix = mat4.create();

var batch = new SpriteBatch();
batch.setProjectionMatrix(projectionMatrix);
batch.setMVMatrix(mvMatrix);

var manager = new LoadingManager();

input.setListener((type, key) => {
	stateManager.getState().onKey(type, key);
});

var loadingScreen = new LoadingScreen();
stateManager.setState(loadingScreen);

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
var battleState = new BattleState(loadingScreen, playerTrainer, enemyTrainer);

// var game = new Game();

var lastTime = (performance || Date).now();
var time = 0; // Total elapsed time
var requestID;
var width, height;

var update = function(timestamp) {
	requestID = window.requestAnimationFrame(update);
	var dt = timestamp - lastTime;
	lastTime = timestamp;
	time += dt;

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	var state = stateManager.getState();
	state.update(dt, time);
	if (width !== 640 || height !== 480 || (state.widget && state.widget.flags & Widget.FLAG_LAYOUT_REQUIRED)) {
		width = 640;
		height = 480;
		state.resize(width, height);
	}
	state.draw(batch, dt, time);

	batch.flush();

	/*var error = gl.getError();
	if (error !== gl.NO_ERROR && error !== gl.CONTEXT_LOST_WEBGL) {
		console.error("OpenGL error.");
	}*/
	input.pressedKeys.length = 0;
};

window.requestAnimationFrame(update);

loader.onstart = function() {
	// window.cancelAnimationFrame(requestID);
};

loader.onload = function() {
	stateManager.setState(game);
};

loader.check();
