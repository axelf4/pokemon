var OrthogonalMapRenderer = function(map, batch) {
	this.map = map;
	this.batch = batch;
};

OrthogonalMapRenderer.prototype.drawLayer = function(layer) {
	var map = this.map;
	var batch = this.batch;
	var data = layer.data;
	var y = 0;
	for (var row = 0, rows = map.height; row < rows; ++row) {
		var x = 0;
		for (var col = 0, cols = map.width; col < cols; ++col) {
			var gid = data[col + row * map.width];
			if (gid !== 0) {
				var tileset = layer.tilesetForGid[gid];
				// var x1 = col * map.tilewidth;
				// var y1 = row * map.tileheight;
				var x1 = x, y1 = y;
				var x2 = x1 + map.tilewidth;
				var y2 = y1 + map.tileheight;
				var sx = (tileset.getTileX(gid) - 1) * tileset.tilewidth;
				var sy = tileset.getTileY(gid) * tileset.tileheight;
				var imageWidth = tileset.texture.width, imageHeight = tileset.texture.height;
				var u1 = (sx + 0.5) / imageWidth, v1 = (sy + 0.5) / imageHeight, u2 = (sx - 0.5 + tileset.tilewidth) / imageWidth, v2 = (sy - 0.5 + tileset.tileheight) / imageHeight;

				batch.draw(tileset.texture.texture, x1, y1, x2, y2, u1, v1, u2, v2);
			}

			x += map.tilewidth;
		}
		y += map.tileheight;
	}
};

OrthogonalMapRenderer.prototype.drawLayers = function(layers) {
	for (var i = 0, length = layers.length; i < length; ++i) {
		var layer = this.map.layers[layers[i]];
		this.drawLayer(layer);
	}
};

module.exports = OrthogonalMapRenderer;
