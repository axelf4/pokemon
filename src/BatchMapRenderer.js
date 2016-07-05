var BatchMapRenderer = function(map, batch) {
	this.map = map;
	this.batch = batch;
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

BatchMapRenderer.prototype.draw = function(layers) {
	for (var layerId = 0, layerCount = layers.length; layerId < layerCount; ++layerId) {
		var layer = layers[layerId];
		var data = layer.data;
		for (var row = layer.x, rows = layer.x + layer.width; row < rows; row++) {
			for (var col = layer.y, cols = layer.y + layer.height; col < cols; col++) {
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

				batch.draw(tileset.texture.texture, x1, y1, x2, y2, u1, v1, u2, v2);
			}
		}
	}
};

module.exports = BatchMapRenderer;
