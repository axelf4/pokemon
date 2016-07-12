var texture = require("texture.js");
var renderer = require("renderer.js");
var glMatrix = require("gl-matrix");
var path = require("path");
var base64 = require("base64-js");

var gl = renderer.gl;
var vec2 = glMatrix.vec2;

// TODO make maps the JSON format and the maprenderer load the images
exports.loadMapFromJSON = function(data) {
	throw new Error("Not yet implemented.");
};

var TileSet = function() {
};
TileSet.prototype.getTileX = function(id) {
	return id % this.tilesAcross;
};
TileSet.prototype.getTileY = function(id) {
	return Math.floor(id / this.tilesAcross);
};

var Map = function() {};

var loadMap = function(loader, url) {
	return loader.loadXML(url).then(function(dom) {
		var dirname = path.dirname(url); // url.replace(/\\/g, '/').replace(/\/[^\/]*\/?$/, '') + '/';
		var root = dom.documentElement;
		var map = new Map();
		if (root.getAttribute("version") !== "1.0") throw new Error("invalid map format");
		map.width = parseInt(root.getAttribute("width"));
		map.height = parseInt(root.getAttribute("height"));
		map.tilewidth = parseInt(root.getAttribute("tilewidth"));
		map.tileheight = parseInt(root.getAttribute("tileheight"));

		var tilesets = map.tilesets = [];
		var tilesetNodes = root.getElementsByTagName("tileset");
		var tilesetPromises = [];
		for (var i = 0, length = tilesetNodes.length; i < length; i++) {
			tilesetPromises.push(new Promise(function(resolve, reject) {
				var tilesetNode = tilesetNodes[i];
				var tileset = tilesets[i] = new TileSet();
				tileset.firstgid = tilesetNode.getAttribute("firstgid");
				var source = tilesetNode.getAttribute("source");
				if (source) {
					loader.loadXML(path.join(dirname, source)).then(function(dom) {
						var tilesetRoot = dom.documentElement;
						tileset.name = tilesetRoot.getAttribute("name");
						tileset.tilewidth = parseInt(tilesetRoot.getAttribute("tilewidth"));
						tileset.tileheight = parseInt(tilesetRoot.getAttribute("tileheight"));
						var image = tilesetRoot.getElementsByTagName("image")[0];
						tileset.imagePath = path.join(dirname, image.getAttribute("source"));
						tileset.imageWidth = parseInt(image.getAttribute("width"));
						tileset.imageHeight = parseInt(image.getAttribute("height"));
						resolve(tileset);
					});
				} else {
					tileset.name = tilesetNode.getAttribute("name");
					tileset.tilewidth = parseInt(tilesetNode.getAttribute("tilewidth"));
					tileset.tileheight = parseInt(tilesetNode.getAttribute("tileheight"));
					var image = tilesetNode.getElementsByTagName("image")[0];
					tileset.imagePath = path.join(dirname, image.getAttribute("source"));
					// TODO get the dimensions from the actual image
					tileset.imageWidth = parseInt(image.getAttribute("width"));
					tileset.imageHeight = parseInt(image.getAttribute("height"));
					resolve(tileset);
				}
			}).then(tileset => {
				tileset.tilesAcross = tileset.imageWidth / tileset.tilewidth;
				return loader.loadTextureRegion(tileset.imagePath)
					.then(textureRegion => {
						tileset.texture = textureRegion;
					});
			}));
		}
		return Promise.all(tilesetPromises).then(function() {
			// getElementsByTagName returns a HTMLLiveCollection
			map.layers = Array.prototype.map.call(root.getElementsByTagName("layer"), layerNode => {
				var layer = {};
				layer.name = layerNode.getAttribute("name");
				layer.data = [];
				var data = layerNode.getElementsByTagName("data")[0];
				var encoding = data.getAttribute("encoding");
				if (encoding === "csv") {
					var array = data.textContent.split(",");
					for (var i = 0; i < array.length; ++i) {
						layer.data[i] = parseInt(array[i]);
					}
				} else if (encoding === "base64") {

				} else throw new Error("Unsupported encoding for TML layer data.");
				/*
				   if (data.getAttribute("encoding") !== "base64" || !!data.getAttribute("compression")) throw new Error("Bad encoding or compression.");
				   var buffer = new Buffer(text, 'base64');
				   for (var i = 0, length = map.width * map.height; i < length; i++) {
				// TODO account for flips
				layer.data[i] = buffer.readUInt32LE(i);
				}
				*/
				layer.tilesetForGid = [];
				for (var j = 0, length = layer.data.length; j < length; ++j) {
					var gid = layer.data[j];
					var tilesetId = tilesets.length;
					while (tilesetId--) {
						var tileset = tilesets[tilesetId];
						if (tileset.firstgid <= gid) {
							layer.tilesetForGid[gid] = tileset;
							break;
						}
					}
				}
				return layer;
			});
			return map;
		});
	});
};
exports.loadMap = loadMap;

Map.prototype.getTilesetByGID = function(gid) {
	for (var i = tilesets.length; i >= 0; --i) {
		var tileset = tilesets[i];
		if (tileset.firstGid <= gid) return tileset;
	}
	return null;
};

exports.getLayerIdByName = function(map, name) {
	for (var i = 0, length = map.layers.length; i < length; i++) {
		if (map.layers[i].name === name) return i;
	}
	throw new Error("Map has no layer called " + name + ".");
};
