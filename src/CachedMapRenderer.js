var renderer = require("renderer.js");
var glMatrix = require("gl-matrix");
var path = require("path");
var base64 = require("base64-js");
var pow2 = require("pow2");

var gl = renderer.gl;
var vec2 = glMatrix.vec2;

var MapRenderer = function(map) {
	this.map = map;
	if (map.tilewidth !== map.tileheight) throw new Error("Tile dimensions do not match.");
	this.tileSize = map.tilewidth;

	var width = map.width, height = map.height;
	if (!pow2.isPowerOfTwo(width)) width = pow2.nextHighestPowerOfTwo(width);
	if (!pow2.isPowerOfTwo(height)) height = pow2.nextHighestPowerOfTwo(height);

	// Upload the layers
	var components = 3;
	var layerCount = map.layers.length;
	var layersFromLayerId = this.layersFromLayerId = new Array(layerCount);
	for (var i = 0; i < layerCount; ++i) {
		var layer = map.layers[i];
		layersFromLayerId[i] = [];
		// if (!layer.visible) continue; // Commented because visible should only affect the Tiled editor

		for (var tsId = map.tilesets.length; tsId--;) {
			var tileset = map.tilesets[tsId];
			var tilesetUsed = false, otherTilesetsUsed = false;
			var data = new Uint8Array(width * height * components), idx = 0;
			for (var col = 0, colCount = height; col < colCount; col++) {
				for (var row = 0, rowCount = width; row < rowCount; row++) {
					if (col < map.height && row < map.width) {
						var gid = layer.data[row + col * map.width];
						if (gid >= tileset.firstgid) {
							tilesetUsed = true;
							data[idx++] = tileset.getTileX(gid) - 1;
							data[idx++] = tileset.getTileY(gid);
							data[idx++] = 1;
							continue;
						}
					}
					otherTilesetsUsed = true;
					data[idx++] = 0;
					data[idx++] = 0;
					data[idx++] = 0;
				}
			}
			if (!tilesetUsed) continue;

			var tiles = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, tiles);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, data);

			layersFromLayerId[i].push({
				layer: layer,
				tileset: tileset,
				sprites: tileset.texture,
				tiles: tiles,
			});

			if (!otherTilesetsUsed) break;
		}
	}

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

	var program = this.program = renderer.createProgram({
		vertexShader: vertexShader,
		fragmentShader: fragmentShader
	});
	gl.useProgram(this.program);
	gl.uniform1f(gl.getUniformLocation(this.program, "tileSize"), this.tileSize);
	gl.uniform1f(gl.getUniformLocation(this.program, "inverseTileSize"), 1 / this.tileSize);
	gl.uniform1i(gl.getUniformLocation(this.program, "sprites"), 0);
	gl.uniform1i(gl.getUniformLocation(this.program, "tiles"), 1);
	gl.uniform2f(gl.getUniformLocation(this.program, "inverseTileTextureSize"), 1 / width, 1 / height);

	this.scaledViewportSize = vec2.create();

	this.viewportSizeLoc = gl.getUniformLocation(this.program, "viewportSize");
	this.viewOffsetLoc = gl.getUniformLocation(this.program, "viewOffset");
	this.inverseSpriteTextureSizeLoc = gl.getUniformLocation(this.program, "inverseSpriteTextureSize");
};

// TODO add a draw layer method

MapRenderer.prototype.drawLayers = function(layerIds, x, y, width, height) {
	gl.useProgram(this.program);

	gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVertBuffer);

	var positionLocation = 0;
	var textureLocation = 1;
	gl.enableVertexAttribArray(positionLocation);
	gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);
	gl.enableVertexAttribArray(textureLocation);
	gl.vertexAttribPointer(textureLocation, 2, gl.FLOAT, false, 16, 8);

	var scrollScaleX = 1, scrollScaleY = 1;
	gl.uniform2f(this.viewOffsetLoc, Math.floor(x * scrollScaleX), Math.floor(y * scrollScaleY));
	vec2.set(this.scaledViewportSize, width, height);
	gl.uniform2fv(this.viewportSizeLoc, this.scaledViewportSize);

	var lastTexture = null;

	// Draw each layer of the map
	for (var i = 0, length = layerIds.length; i < length; i++) {
		var layerId = layerIds[i];
		var layers = this.layersFromLayerId[layerId];
		for (var j = 0, length2 = layers.length; j < length2; j++) {
			var layer = layers[j];
			var sprites = layer.sprites;

			// If the last layer used the same sprite: don't update it
			if (lastTexture !== sprites.texture) {
				gl.uniform2f(this.inverseSpriteTextureSizeLoc, 1 / sprites.width, 1 / sprites.height);

				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, sprites.texture);
				gl.activeTexture(gl.TEXTURE1);
				lastTexture = sprites.texture;
			}

			// The layer texture is always unique
			gl.bindTexture(gl.TEXTURE_2D, layer.tiles);

			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		}
	}
};

module.exports = MapRenderer;
