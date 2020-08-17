import "core-js/stable";
import "regenerator-runtime/runtime";

import * as renderer from "renderer";
import {mat4, vec3} from "gl-matrix";
import SpriteBatch from "SpriteBatch";
import FileLoader from "FileLoader";
import LoaderFacade from "LoaderFacade";
import * as input from "input";
import * as stateManager from "stateManager";
import promiseTrap from "promise-trap";
import cachingProxy from "cachingProxy";
var resources = require("resources");
var Font = require("font.js");
import NinePatch from "NinePatch";
import Game from "Game";
import TransitionState, {fade} from "TransitionState";
import "touchControl";
import TWEEN from "@tweenjs/tween.js";

import Trainer from "Trainer";
import Pokemon, {pokemons, moves} from "./pokemon";
import Item from "./item";

import * as lootTable from "lootTable";

console.log("----- Starting the game -----");

const gl = renderer.gl;
const projectionMatrix = mat4.create();
const batch = new SpriteBatch();

input.setListener((type, key) => {
	if (type === input.KEY_ACTION_UP && key === "f") renderer.toggleFullscreen();
	else stateManager.getState().onKey(type, key);
});

const loader = promiseTrap(cachingProxy(
			new LoaderFacade(new FileLoader("pokemongame"))));

const transitionState = new TransitionState(null, fade);
stateManager.setState(transitionState);

resources.font = new Font(loader);
loader.loadTexture("textures/frame.9.png").then(texRegion => {
	resources.frame = NinePatch.fromTextureRegion(texRegion);
}).then(() => {
	let playerName = lootTable.choose([[1, "Axel"], [1, "Bob"]]);
	const playerTrainer = new Trainer(playerName, [
			new Pokemon(pokemons.snoopDogg, 6, [ moves.tackle, moves.growl ]),
			new Pokemon(pokemons.slowpoke, 4, [ moves.tackle, moves.growl ]),
	]);
	playerTrainer.items.push(Item.Pokeball);
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
	let dt = timestamp - lastTime;
	if (dt > 1000) dt = 0; // If the user comes back to the tab after a large amount of time
	lastTime = timestamp;

	var state = stateManager.getState();
	state.update(dt, timestamp);
	TWEEN.update(timestamp);

	var resized = renderer.sizeCanvas();
	if (resized) {
		let {width, height} = renderer.getSize();
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
