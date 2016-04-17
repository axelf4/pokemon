var texture = require("texture.js");
var loader = require("Loader.js");
var renderer = require("renderer.js");
var glMatrix = require("gl-matrix");

var gl = renderer.gl;
var vec2 = glMatrix.vec2;

var Map = function() {};
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
		var layer = {};
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
			for (var row = layer.x, length = layer.x + layer.width; row < length; row++) {
				for (var col = layer.y, length = layer.y + layer.height; col < length; col++) {
					var gid = layer.data[row + col * layer.width];
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
			if (!gid) continue;
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

var MapRenderer = function(map) {
	this.map = map;
	if (map.tileWidth !== map.tileHeight) console.error("Dimensions doesn't match.");
	this.tileSize = map.tileWidth;
	var components = 3;

	var layers = this.layers = new Array();
	for (var i = 0; i < map.layers.length; i++) {
		var layer = map.layers[i];
		if (!layer.visible) continue;
		var width = layer.width;
		var height = layer.height;

		for (var tsId = map.tilesets.length; tsId--;) {
			var tileset = map.tilesets[tsId];
			var tilesetUsed = false, otherTilesetsUsed = false;
			var data = new Uint8Array(width * height * components);
			var idx = 0;
			for (var col = layer.y, length = layer.y + layer.height; col < length; col++) {
				for (var row = layer.x, length = layer.x + layer.width; row < length; row++) {
					var gid = layer.data[row + col * layer.width];
					if (gid >= tileset.firstGid) {
						tilesetUsed = true;
						data[idx++] = tileset.getTileX(gid) - 1;
						data[idx++] = tileset.getTileY(gid);
						data[idx++] = 1;
					} else {
						otherTilesetsUsed = true;
						data[idx++] = 0;
						data[idx++] = 0;
						data[idx++] = 0;
					}
				}
			}
			if (!tilesetUsed) continue;

			var texture = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, data);

			this.layers.push({
				layer: layer,
				width: width,
				height: height,
				tileset: tileset,
				tiles: texture,
			});

			if (!otherTilesetsUsed) break;
		}
	}

	var vertexShader = [
		"precision mediump float;",

		"attribute vec2 position;",
		"attribute vec2 texture;",

		"varying vec2 pixelCoord;",
		"varying vec2 texCoord;",

		"uniform vec2 viewOffset;",
		"uniform vec2 viewportSize;",
		"uniform vec2 inverseTileTextureSize;",
		"uniform float inverseTileSize;",

		"void main(void) {",
		"	pixelCoord = (texture * viewportSize) + viewOffset;",
		"	texCoord = pixelCoord * inverseTileTextureSize * inverseTileSize;",
		"	gl_Position = vec4(position, 0.0, 1.0);",
		"}"
	].join("\n");

	var fragmentShader = [
		"precision mediump float;",

		"varying vec2 pixelCoord;",
		"varying vec2 texCoord;",

		"uniform sampler2D tiles;",
		"uniform sampler2D sprites;",
		"uniform vec2 inverseSpriteTextureSize;",
		"uniform float tileSize;",

		"void main(void) {",
		"	vec4 tile = texture2D(tiles, texCoord);",
		"	if (texCoord.x < .0 || texCoord.y < .0 || texCoord.x > 1.0 || texCoord.y > 1.0 || tile.z == .0) discard;",
		"	vec2 spriteOffset = floor(tile.xy * 256.0) * tileSize;",
		"	vec2 spriteCoord = mod(pixelCoord, tileSize);",
		"	gl_FragColor = texture2D(sprites, (spriteOffset + spriteCoord) * inverseSpriteTextureSize);",
		"}"
	].join("\n");

	var quadVerts = [
		//x  y  u  v
		1,  1, 1, 0,
		-1,  1, 0, 0,
		1, -1, 1, 1,
		-1, -1, 0, 1,
	];
	this.quadVertBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVertBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadVerts), gl.STATIC_DRAW);

	var program = this.program = renderer.createProgram({
		vertexShader: vertexShader,
		fragmentShader: fragmentShader
	});
	gl.useProgram(this.program);
	gl.uniform1f(gl.getUniformLocation(this.program, "tileSize"), this.tileSize);
	gl.uniform1f(gl.getUniformLocation(this.program, "inverseTileSize"), 1 / this.tileSize);
	gl.uniform1i(gl.getUniformLocation(this.program, "sprites"), 0);
	gl.uniform1i(gl.getUniformLocation(this.program, "tiles"), 1);

	this.scaledViewportSize = vec2.create();
	vec2.set(this.scaledViewportSize, 640, 480);

	this.viewportSizeLoc = gl.getUniformLocation(this.program, "viewportSize");
	this.viewOffsetLoc = gl.getUniformLocation(this.program, "viewOffset");
	this.inverseTileTextureSizeLoc = gl.getUniformLocation(this.program, "inverseTileTextureSize");
	this.inverseSpriteTextureSizeLoc = gl.getUniformLocation(this.program, "inverseSpriteTextureSize");

};
Map.MapRenderer = MapRenderer;

MapRenderer.prototype.draw = function() {
	var x = 0, y = 0;
	gl.useProgram(this.program);

	gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVertBuffer);

	var positionLocation = 0;
	var textureLocation = 1;
	gl.enableVertexAttribArray(positionLocation);
	gl.enableVertexAttribArray(textureLocation);
	gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);
	gl.vertexAttribPointer(textureLocation, 2, gl.FLOAT, false, 16, 8);

	gl.uniform2fv(this.viewportSizeLoc, this.scaledViewportSize);

	var scrollScaleX = 1, scrollScaleY = 1;

	// Draw each layer of the map
	for (var i = 0, length = this.layers.length; i < length; i++) {
		var layer = this.layers[i];

		gl.uniform2f(this.viewOffsetLoc, Math.floor(x * scrollScaleX), Math.floor(y * scrollScaleY));
		gl.uniform2f(this.inverseTileTextureSizeLoc, 1 / layer.width, 1 / layer.height);
		gl.uniform2f(this.inverseSpriteTextureSizeLoc, 1 / layer.tileset.texture.width, 1 / layer.tileset.texture.height);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, layer.tileset.texture.texture);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, layer.tiles);

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}
};

module.exports = Map;
