var Position = require("Position.js");
var OldPosition = require("OldPosition.js");

// A script that thriggers when the player tries to walk onto a tile.
var PushTrigger = function(x, y, script) {
	this.x = x;
	this.y = y;
	this.script = script;
};

PushTrigger.createWarp = function(mapScript, targetX, targetY) {
	return function(context) {
		var em = context.em;
		var pos = em.getComponent(context.player, Position);
		var oldpos = em.getComponent(context.player, OldPosition);
		oldpos.x = pos.x = targetX;
		oldpos.y = pos.y = targetY;
		context.clearLevel();
		context.loadScript(mapScript);
	};
};

module.exports = PushTrigger;
