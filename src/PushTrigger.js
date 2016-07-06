var game = require("Game.js");
var Position = require("Position.js");
var OldPosition = require("OldPosition.js");
var direction = require("direction");

// A script that thriggers when the player tries to walk onto a tile.
var PushTrigger = function(script) {
	this.script = script;
};

/**
 * Returns true if the script ran or false if it didn't.
 * @param x The x coordinate of the tile the player tries to push into
 * @param y The y coordinate of the tile the player tries to push into
 */
PushTrigger.prototype.runForTile = function(x, y) {
	throw new Error("runForTile not implemented.");
};

var TilePushTrigger = PushTrigger.TilePushTrigger = function(script, x, y) {
	PushTrigger.call(this, script);
	this.x = x;
	this.y = y;
};
TilePushTrigger.prototype = Object.create(PushTrigger.prototype);
TilePushTrigger.prototype.constructor = TilePushTrigger;

TilePushTrigger.prototype.runForTile = function(x, y) {
	if (this.x === x && this.y === y) {
		this.script();
		return true;
	} else return false;
};

var EdgePushTrigger = PushTrigger.EdgePushTrigger = function(script, game, edge) {
	PushTrigger.call(this, script);
	this.game = game;
	this.edge = edge;
};
EdgePushTrigger.prototype = Object.create(PushTrigger.prototype);
EdgePushTrigger.prototype.constructor = EdgePushTrigger;

EdgePushTrigger.prototype.runForTile = function(x, y) {
	var map = this.game.getMap();
	var mapWidth = map.width, mapHeight = map.height;
	var edge = this.edge;
	if (edge === direction.LEFT && x === -1
			|| edge === direction.UP && y === -1
			|| edge === direction.RIGHT && x === mapWidth
			|| edge === direction.DOWN && y === mapHeight) {
		this.script();
		return true;
	} else return false;
};

PushTrigger.createWarp = function(game, x, y, targetX, targetY, mapScript) {
	return new TilePushTrigger(function() {
		game.warp(targetX, targetY, mapScript);
	}, x, y);
};

PushTrigger.createEdgeWarp = function(game, edge, targetX, targetY, mapScript) {
	return new EdgePushTrigger(function() {
		game.warp(targetX, targetY, mapScript);
	}, game, edge);
};

module.exports = PushTrigger;
