var glMatrix = require("gl-matrix");
var BitSet = require("bitset");
var renderer = require("renderer.js");
var SpriteBatch = require("SpriteBatch.js");
var sign = require("sign.js");
var LoadingManager = require("LoadingManager.js");
var Animation = require("Animation.js");
var flex = require("flex.js");
var gui = require("gui.js");
var input = require("input.js");
var texture = require("texture.js");
var StackLayout = require("StackLayout.js");
var loader = require("loader.js");
var container = require("container.js");

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
mat4.translate(mvMatrix, mvMatrix, translation);

var manager = new LoadingManager();

var game = require("Game.js");
var gameFrame = new game.GameFrame();
container.addWidget(gameFrame);
gameFrame.focus();

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

	// gui.prepareNode(container);
	container.width = 640;
	container.height = 480;
	var node = container;
	do {
		if (node.dirty) node.manager.layout(node);
		if (node.update) node.update(dt, time, spriteBatch);
		var children = node.children;
		node = null;
		for (var i = 0, length = children.length; i < length; i++) {
			var child = children[i];
			if (child.focused) node = child;
		}
	} while (node);

	spriteBatch.flush();

	/*var error = gl.getError();
	if (error !== gl.NO_ERROR && error !== gl.CONTEXT_LOST_WEBGL) {
		console.error("OpenGL error.");
	}*/

	if (input.pressedKeys.indexOf(32) !== -1) {
		// if (context.getDialogue()) {
			// context.advanceOrHideDialogue();
		// }
	}

	input.pressedKeys.length = 0;
};

loader.onstart = function() {
	window.cancelAnimationFrame(requestID);
};

loader.onload = function() {
	window.requestAnimationFrame(update);
};
loader.check();
