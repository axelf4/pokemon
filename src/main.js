var glMatrix = require("gl-matrix");
var renderer = require("renderer.js");
import SpriteBatch from "SpriteBatch";
import FileLoader from "FileLoader";
import LoaderFacade from "LoaderFacade";
var input = require("input.js");
import * as stateManager from "stateManager";
import promiseTrap from "promise-trap";
import cachingProxy from "cachingProxy";
var resources = require("resources");
var Font = require("font.js");
import NinePatch from "NinePatch";
import Game from "Game";
import TransitionState, {fade} from "TransitionState";
var fowl = require("fowl");
const TWEEN = require("@tweenjs/tween.js");

var Position = require("Position.js");
import DirectionComponent from "DirectionComponent";
var SpriteComponent = require("SpriteComponent.js");
var PlayerComponent = require("PlayerComponent.js");
var InteractionComponent = require("InteractionComponent.js");
import { MovementComponent } from "movement";
var LineOfSightComponent = require("LineOfSightComponent");
var AnimationComponent = require("AnimationComponent");
var DimensionComponent = require("DimensionComponent");

import Trainer from "Trainer";
import { move } from "move";
import Pokemon, { getPokemonByName } from "pokemon";

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
		MovementComponent,
		LineOfSightComponent,
		AnimationComponent,
		DimensionComponent);

const projectionMatrix = mat4.create();
const batch = new SpriteBatch();

input.setListener((type, key) => {
	stateManager.getState().onKey(type, key);
});

const loader = promiseTrap(cachingProxy(
			new LoaderFacade(new FileLoader("pokemongame"))));

const transitionState = new TransitionState(null, fade);
stateManager.setState(transitionState);

resources.font = new Font(loader);
loader.loadTexture("textures/frame.9.png").then(texRegion => {
	resources.frame = NinePatch.fromTextureRegion(texRegion);
}).then(() => {
	const playerTrainer = new Trainer("Axel", [
			new Pokemon("Snoop Dogg", 6, [ move.tackle, move.growl ]),
			new Pokemon("Slowpoke", 4, [ move.tackle, move.growl ]),
	]);
	const game = new Game(loader, batch, playerTrainer);
	game.loadScript("home.js");
	game.warp(9, 3);

	loader.all().then(() => {
		console.log("Loaded initial assets.");
		transitionState.transitionTo(game);
	}, () => {
		console.log("Some asset was rejected.");
	});

});

var requestID, lastTime = (performance || Date).now();

var update = function(timestamp) {
	requestID = window.requestAnimationFrame(update);
	var dt = timestamp - lastTime;
	if (dt > 1000) dt = 0; // If the user comes back to the tab after a large amount of time
	lastTime = timestamp;

	var state = stateManager.getState();
	state.update(dt, timestamp);
	TWEEN.update(timestamp);

	var resized = renderer.sizeCanvas();
	if (resized) {
		var width = renderer.getWidth(), height = renderer.getHeight();
		mat4.ortho(projectionMatrix, 0, width, height, 0, -1, 1);
		batch.setProjectionMatrix(projectionMatrix);

		state.resize(width, height);
	}

	state.draw(batch, dt, timestamp);

	/*const error = gl.getError();
	if (error !== gl.NO_ERROR && error !== gl.CONTEXT_LOST_WEBGL) {
		console.error("OpenGL error.");
	}*/
};

window.requestAnimationFrame(update);
