var path = require("path");
var base64 = require("base64-js");

export default class TiledMap {
	getLayerIdByName(name) {
		for (var i = 0, length = this.layers.length; i < length; i++) {
			if (this.layers[i].name === name) return i;
		}
		throw new Error("Map has no layer called " + name + ".");
	}

	getTileSetByGid(gid) {
		for (let tileSetId = this.tilesets.length - 1; tileSetId >= 0; --tileSetId)
			if (this.tilesets[tileSetId].firstgid <= gid) return this.tilesets[tileSetId];
		throw "No tile set found for gid " + gid;
	}
};

class TileSet {
	/** Returns the pixel x-coordinate of the tile with the specified gid. */
	getTileX(id) {
		return this.margin + (this.tilewidth + this.spacing) * ((id - this.firstgid) % this.columns);
	}
	/** Returns the pixel y-coordinate of the tile with the specified gid. */
	getTileY(id) {
		return this.margin + (this.tileheight + this.spacing) * Math.floor((id - this.firstgid) / this.columns);
	}
}

export async function loadMap(loader, url) {
	let dom = await loader.loadXML(url);
	let dirname = path.dirname(url); // url.replace(/\\/g, '/').replace(/\/[^\/]*\/?$/, '') + '/';
	let root = dom.documentElement;
	if (root.getAttribute("version") !== "1.2") throw new Error("Invalid map format");
	let map = Object.assign(new TiledMap(), {
		width: parseInt(root.getAttribute("width")),
		height: parseInt(root.getAttribute("height")),
		tilewidth: parseInt(root.getAttribute("tilewidth")),
		tileheight: parseInt(root.getAttribute("tileheight")),
		tilesets: await Promise.all(Array.prototype.map.call(root.getElementsByTagName("tileset"),
			async tilesetNode => {
				let source = tilesetNode.getAttribute("source");
				let node = source ? (await loader.loadXML(path.join(dirname, source))).documentElement : tilesetNode;
				let imageNode = node.getElementsByTagName("image")[0];
				let imagePath = path.join(dirname, imageNode.getAttribute("source"));

				return Object.assign(new TileSet(), {
					firstgid: parseInt(tilesetNode.getAttribute("firstgid")),
					name: node.getAttribute("name"),
					tilewidth: parseInt(node.getAttribute("tilewidth")), tileheight: parseInt(node.getAttribute("tileheight")),
					spacing: parseInt(node.getAttribute("spacing")),
					margin: parseInt(node.getAttribute("margin")),
					columns: parseInt(node.getAttribute("columns")),
					imagePath,
					imageWidth: parseInt(imageNode.getAttribute("width")), imageHeight: parseInt(imageNode.getAttribute("height")),
					texture: await loader.loadTexture(imagePath),
				});
			})),
	});

	// getElementsByTagName returns a HTMLLiveCollection
	map.layers = Array.prototype.map.call(root.getElementsByTagName("layer"), layerNode => {
		let layer = {};
		layer.name = layerNode.getAttribute("name");
		layer.data = [];
		let dataNode = layerNode.getElementsByTagName("data")[0];
		var encoding = dataNode.getAttribute("encoding");
		if (encoding === "csv") {
			var array = dataNode.textContent.split(",");
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
		return layer;
	});

	return map;
};
