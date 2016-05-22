var game = require("Game.js");
var Position = require("Position.js");
var OldPosition = require("OldPosition.js");

// A script that thriggers when the player tries to walk onto a tile.
var PushTrigger = function(x, y, script) {
	this.x = x;
	this.y = y;
	this.script = script;
};

PushTrigger.createWarp = function(mapScript, targetX, targetY) {
	return function() {
		var em = game.em;
		var pos = em.getComponent(game.player, Position);
		var oldpos = em.getComponent(game.player, OldPosition);
		oldpos.x = pos.x = targetX;
		oldpos.y = pos.y = targetY;
		game.clearLevel();
		game.loadScript(mapScript);
	};
};

module.exports = PushTrigger;
