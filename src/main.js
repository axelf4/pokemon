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

input.setListener((type, keyCode) => {
	stateManager.getState().onKey(type, keyCode);
});

var loadingScreen = new LoadingScreen();
stateManager.setState(loadingScreen);
var battleState = new BattleState(loadingScreen);

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
};

update();

loader.onstart = function() {
	// window.cancelAnimationFrame(requestID);
};

loader.onload = function() {
	stateManager.setState(battleState);
};

loader.check();
