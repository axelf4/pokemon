var Map = require("map.js");
var direction = require("direction");
var PushTrigger = require("PushTrigger.js");
import thread from "thread";
import Trainer from "Trainer";
import { move } from "move";
import Pokemon, { getPokemonByName } from "pokemon";

var Position = require("Position");
var DirectionComponent = require("DirectionComponent");
var InteractionComponent = require("InteractionComponent");
var LineOfSightComponent = require("LineOfSightComponent");
var DimensionComponent = require("DimensionComponent");

module.exports = function(game, loader) {
	loader.loadMap("assets/home.tmx").then(map => {
		game.setMap(map, ["Tile Layer 1", "Tile Layer 2", "Tile Layer 3"], ["Foreground"]);
	});

	game.addPushTrigger(PushTrigger.createWarp(game, 2, 9, 6, 8, "ballettown.js"));

	var em = game.em;

	var mom = em.createEntity();
	em.addComponent(mom, new Position(6, 6));
	em.addComponent(mom, new DirectionComponent(direction.UP));
	game.loadCharacterSprite(mom, "assets/girlSprite.png");
	em.addComponent(mom, new InteractionComponent(thread.bind(undefined, function*(game) {
		game.lock();
		game.faceEachOther(mom, game.player);
		yield game.showDialog("Happy birthday! Now that you are 16 I no longer receive Child Benefit, hence you are useless.");
		yield game.showDialog("Stop watching anime and go out and play, you son of a bitch.");
		yield game.showDialog("I heard Prof. Clark has moved in. Maybe you could go bother him.");
		yield game.battle(new Trainer("Charles Ingvar", [
			new Pokemon("Slowpoke", 4, [ move.tackle ])
		]));
		game.release();
	})));

	var tv = em.createEntity();
	em.addComponent(tv, new Position(5, 4));
	em.addComponent(tv, new DimensionComponent(2, 1));
	em.addComponent(tv, new InteractionComponent(thread.bind(undefined, function*(game) {
			game.lock();
			yield game.showDialog("A cooking show is airing on the television.");
			yield game.showDialog("\"How to microwave cheese\", starring Gordon Ramsay and macaroni.");
			game.release();
	})));
};
