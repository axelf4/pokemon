var texture = require("texture.js");
var loader = require("Loader.js");

var Cell = function() {
};

var Map = function() {
};
// TODO also add option to load base64, xml, csv
// Loads a TMX map in the JSON format
Map.prototype.fromJSON = function(manager, data, url) {
	this.mapWidth = data.width;
	this.mapHeight = data.height;
	this.tileWidth = data.tilewidth;
	this.tileHeight = data.tileheight;
	this.tilesets = [];
	var lastSet;
	var dirname = url.replace(/\\/g, '/').replace(/\/[^\/]*\/?$/, '') + '/';
	for (var i = 0, length = data.tilesets.length; i < length; i++) {
		var node = data.tilesets[i];
		var tileset = new TileSet();
		tileset.firstGid = node.firstgid;
		var loadTextures = function() {
			if (lastSet) lastSet.lastGid = tileset.firstGid - 1;
			tileset.tilesAcross = tileset.imageWidth / tileset.tileWidth;
			tileset.texture = new texture.Region();
			tileset.texture.loadFromFile(manager, tileset.imagePath);
		};
		if (node.source) {
			var resolved = dirname + node.source;
			manager.start();
			loader.loadFile(resolved, function() {
				var parser = new DOMParser();
				var xmlDoc = parser.parseFromString(this.responseText, "application/xml");
				var root = xmlDoc.documentElement;
				tileset.name = root.getAttribute("name");
				tileset.tileWidth = parseInt(root.getAttribute("tilewidth"));
				tileset.tileHeight = parseInt(root.getAttribute("tileheight"));
				var image = root.getElementsByTagName("image")[0];
				tileset.imagePath = dirname + image.getAttribute("source");
				tileset.imageWidth = parseInt(image.getAttribute("width"));
				tileset.imageHeight = parseInt(image.getAttribute("height"));
				loadTextures();
				manager.end();
			});
		} else {
			tileset.name = node.name;
			tileset.tileWidth = node.tilewidth;
			tileset.tileHeight = node.tileheight;
			tileset.imageWidth = node.imagewidth;
			tileset.imageHeight = node.imageheight;
			tileset.imagePath = dirname + node.image;
			loadTextures();
		}
		this.tilesets.push(tileset);
		lastSet = tileset;
	}
	lastSet.lastGid = 10000;
	this.layers = [];
	for (var i = 0, length = data.layers.length; i < length; i++) {
		var node = data.layers[i];
		var layer = new Layer();
		// TODO parse object layers and imagelayers too
		layer.name = node.name;
		layer.x = node.x;
		layer.y = node.y;
		layer.width = node.width;
		layer.height = node.height;
		layer.data = node.data;
		layer.tilesetForGid = [];
		for (var j = 0; j < layer.data.length; j++) {
			var gid = layer.data[j];
			var cellTileset;
			for (var k = this.tilesets.length; k--;) {
				var tileset = this.tilesets[k];
				if (tileset.firstGid <= gid) {
					cellTileset = tileset;
					break;
				}
			}
			layer.tilesetForGid[gid] = cellTileset;
		}
		layer.visible = node.visible;
		this.layers.push(layer);
	}
};
Map.prototype.getTilesetByGID = function(gid) {
	for (var i = 0; i < tilesets.length; i++) {
		var tileset = tilesets[i];
		if (tileset.firstGid <= gid && tileset.lastGid >= gid) return tileset;
	}
	return null;
};
Map.prototype.draw = function(spriteBatch) {
	for (var i = this.tilesets.length; i--;) {
		var tileset = this.tilesets[i];
		for (var j = 0; j < this.layers.length; j++) {
			var layer = this.layers[j];
			if (!layer.visible) continue;
			var data = layer.data;
			for (var row = layer.x, length = layer.x + layer.width; row < length; row++) {
				for (var col = layer.y, length = layer.y + layer.height; col < length; col++) {
					var gid = data[row + col * layer.width];
					if (gid >= tileset.firstGid) {
						var x1 = row * this.tileWidth;
						var y1 = col * this.tileHeight;
						var x2 = x1 + tileset.tileWidth;
						var y2 = y1 + tileset.tileHeight;
						var sx = (tileset.getTileX(gid) - 1) * tileset.tileWidth;
						var sy = tileset.getTileY(gid) * tileset.tileHeight;
						tileset.imageWidth = 4096;
						tileset.imageHeight = 4096;
						var u1 = sx / tileset.imageWidth, v1 = sy / tileset.imageHeight, u2 = (sx + tileset.tileWidth) / tileset.imageWidth, v2 = (sy + tileset.tileHeight) / tileset.imageHeight;

						spriteBatch.draw(tileset.texture.texture, x1, y1, x2, y2, u1, v1, u2, v2);
					}
				}
			}
		}
	}
};
Map.prototype.drawLayer = function(spriteBatch, layer) {
	var data = layer.data;
	for (var row = layer.x, length = layer.x + layer.width; row < length; row++) {
		for (var col = layer.y, length = layer.y + layer.height; col < length; col++) {
			var gid = data[row + col * layer.width];
			var tileset = layer.tilesetForGid[gid];
			var x1 = row * this.tileWidth;
			var y1 = col * this.tileHeight;
			var x2 = x1 + tileset.tileWidth;
			var y2 = y1 + tileset.tileHeight;
			var sx = (tileset.getTileX(gid) - 1) * tileset.tileWidth;
			var sy = tileset.getTileY(gid) * tileset.tileHeight;
			tileset.imageWidth = 4096;
			tileset.imageHeight = 4096;
			var u1 = sx / tileset.imageWidth, v1 = sy / tileset.imageHeight, u2 = (sx + tileset.tileWidth) / tileset.imageWidth, v2 = (sy + tileset.tileHeight) / tileset.imageHeight;

			spriteBatch.draw(tileset.texture.texture, x1, y1, x2, y2, u1, v1, u2, v2);
		}
	}
};

var TileSet = function() {
};
TileSet.prototype.getTileX = function(id) {
	return id % this.tilesAcross;
};
TileSet.prototype.getTileY = function(id) {
	return Math.floor(id / this.tilesAcross);
};

var Layer = function() {
};

module.exports = Map;
