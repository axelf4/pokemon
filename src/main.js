var glMatrix = require("gl-matrix");
var renderer = require("renderer.js");
var SpriteBatch = require("SpriteBatch.js");
var LoadingManager = require("LoadingManager.js");
var input = require("input.js");
var loader = require("loader.js");
var root = require("root.js");
var BattleScene = require("BattleScene.js");
var LoadingScreen = require("LoadingScreen.js");

var gl = renderer.gl;
var vec3 = glMatrix.vec3;
var mat4 = glMatrix.mat4;

console.log("----- Starting the game -----");

var projectionMatrix = mat4.create();
mat4.ortho(projectionMatrix, 0, 640, 480, 0, -1, 1);
var mvMatrix = mat4.create();

var spriteBatch = new SpriteBatch();
spriteBatch.setProjectionMatrix(projectionMatrix);
spriteBatch.setMVMatrix(mvMatrix);

var manager = new LoadingManager();

input.setInputListener(root);

var loadingScreen = new LoadingScreen();
root.setWidget(loadingScreen);
var battleScene = new BattleScene();

var lastTime = (performance || Date).now();
var time = 0; // Total elapsed time
var requestID;

var update = function(timestamp) {
	requestID = window.requestAnimationFrame(update);
	var dt = timestamp - lastTime;
	lastTime = timestamp;
	time += dt;

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	root.update(dt, time);
	root.traverse(640, 480);

	root.draw(spriteBatch, dt, time);

	spriteBatch.flush();

	/*var error = gl.getError();
	if (error !== gl.NO_ERROR && error !== gl.CONTEXT_LOST_WEBGL) {
		console.error("OpenGL error.");
	}*/

	input.pressedKeys.length = 0;
};

update();

loader.onstart = function() {
	// window.cancelAnimationFrame(requestID);
};

loader.onload = function() {
	root.setWidget(battleScene);
};

loader.check();
