var Map = require("map.js");
var Position = require("Position.js");
var InteractionComponent = require("InteractionComponent.js");
var PushTrigger = require("PushTrigger.js");

module.exports = function(manager, context) {
	var map = new Map();
	var mapSrc = "assets/ballet town.json";
	manager.loadJSON(mapSrc, function(response) {
		map.fromJSON(manager, response, mapSrc);
	});
	context.setMap(map);

	var forestWarp = PushTrigger.createWarp("forest.js", 3, 12);
	context.pushTriggers.push(new PushTrigger(22, -1, forestWarp));
};
