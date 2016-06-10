var glMatrix = require("gl-matrix");
var BitSet = require("bitset");
var renderer = require("renderer.js");
var SpriteBatch = require("SpriteBatch.js");
var sign = require("sign.js");
var LoadingManager = require("LoadingManager.js");
var Animation = require("Animation.js");
var input = require("input.js");
var texture = require("texture.js");
var StackLayout = require("StackLayout.js");
var loader = require("loader.js");
var scene = require("scene.js");

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
// scene.addWidget(gameFrame);
// gameFrame.focus();

var lastTime = (performance || Date).now();
var time = 0; // Total elapsed time
var requestID;
var traverse = function(node, dt, time, spriteBatch) {
		if (node.dirty) node.manager.layout(node);
		if (node.update) node.update(dt, time, spriteBatch);
		var children = node.children;
		if (children) for (var i = 0, length = children.length; i < length; i++) {
			var child = children[i];
			traverse(child, dt, time, spriteBatch);
		}
};


// TODO temporary
var font = require("font.js");
var testFont = new font();
var MeasureSpec = require("MeasureSpec.js");
var Label = require("Label.js");
var testLabel = new Label(testFont, "Lorem ipsum lol hello.\nAxel\nmy name is. I see you like meatballs! abcdefghijklmnopqrstuvwxyzåäö");
var testNo = false;

var update = function(timestamp) {
	requestID = window.requestAnimationFrame(update);
	var dt = timestamp - lastTime;
	lastTime = timestamp;
	time += dt;

	gl.clearColor(1.0, 1.0, 1.0, 1.0); // TODO TEMPORARY

	gl.clear(gl.COLOR_BUFFER_BIT);

	spriteBatch.projectionMatrix = projectionMatrix;
	spriteBatch.mvMatrix = mvMatrix;

	scene.width = 640;
	scene.height = 480;
	// traverse(scene, dt, time, spriteBatch);

	if (!testNo) {
		testLabel.layout(new MeasureSpec(MeasureSpec.exactly, 200), new MeasureSpec(MeasureSpec.unspecified, undefined));
		testNo = true;
	}
	testLabel.draw(spriteBatch);

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
