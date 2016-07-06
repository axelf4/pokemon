var Map = require("map.js");
var Position = require("Position.js");
var InteractionComponent = require("InteractionComponent.js");
var PushTrigger = require("PushTrigger.js");
var game = require("Game.js");

module.exports = function() {
	var map = new Map();
	var mapSrc = "assets/ballet town.json";
	loader.loadJSON(mapSrc, function(response) {
		map.fromJSON(response, mapSrc);
	});
	game.setMap(map);

	var forestWarp = PushTrigger.createWarp("forest.js", 3, 12);
	game.pushTriggers.push(new PushTrigger(22, -1, forestWarp));
};
