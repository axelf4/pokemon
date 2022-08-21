import * as path from "path";
import * as base64 from "base64-js";
import FileLoader from "./FileLoader";
import { loadXml, loadTextureCached } from "./loader";
import Texture from "./texture";
import { range, unreachable } from "./utils";
import type SpriteBatch from "./SpriteBatch";

class Tileset {
	constructor(readonly firstgid: number,
				private readonly name: string,
				readonly tilewidth: number,
				readonly tileheight: number,
				private readonly spacing: number,
				private readonly margin: number,
				private readonly columns: number,
				private readonly imageWidth: number,
				private readonly imageHeight: number,
				readonly texture: Texture) {}

	/** Returns the pixel x-coordinate of the tile with the specified gid. */
	getTileX(id: number): number {
		return this.margin + (this.tilewidth + this.spacing) * ((id - this.firstgid) % this.columns);
	}

	/** Returns the pixel y-coordinate of the tile with the specified gid. */
	getTileY(id: number): number {
		return this.margin + (this.tileheight + this.spacing) * ((id - this.firstgid) / this.columns | 0);
	}
}

interface Layer {
	name: string;
	data: Array<number>;
}

export default class TiledMap {
	private constructor(
		private readonly width: number,
		private readonly height: number,
		private readonly tilewidth: number,
		private readonly tileheight: number,

		private readonly tilesets: Array<Tileset>,
		private readonly layers: Array<Layer>,
	) {}

	static async load(fileLoader: FileLoader, url: string): Promise<TiledMap> {
		let root = (await loadXml(fileLoader, url)).documentElement;
		if (root.getAttribute("version") !== "1.2") throw new Error("Invalid map format");
		let dirname = path.dirname(url);

		let width = parseInt(root.getAttribute("width") ?? unreachable()),
		height = parseInt(root.getAttribute("height") ?? unreachable()),
		tilewidth = parseInt(root.getAttribute("tilewidth") ?? unreachable()),
		tileheight = parseInt(root.getAttribute("tileheight") ?? unreachable());

		let tilesets = await Promise.all(
			Array.from(root.getElementsByTagName("tileset"))
				.map(async tilesetNode => {
					let source = tilesetNode.getAttribute("source");
					let node = source ? (await loadXml(fileLoader, path.join(dirname, source))).documentElement : tilesetNode;
					let imageNode = node.getElementsByTagName("image")[0];
					let imagePath = path.join(dirname, imageNode.getAttribute("source") ?? unreachable());

					return new Tileset(
						parseInt(tilesetNode.getAttribute("firstgid") ?? unreachable()),
						node.getAttribute("name") ?? unreachable(),
						parseInt(node.getAttribute("tilewidth") ?? unreachable()),
						parseInt(node.getAttribute("tileheight") ?? unreachable()),
						parseInt(node.getAttribute("spacing") ?? "0"),
						parseInt(node.getAttribute("margin") ?? "0"),
						parseInt(node.getAttribute("columns") ?? unreachable()),
						parseInt(imageNode.getAttribute("width") ?? unreachable()),
						parseInt(imageNode.getAttribute("height") ?? unreachable()),
						(await loadTextureCached(fileLoader, imagePath)).texture,
					);
				}));

		// getElementsByTagName returns an HTMLLiveCollection
		let layers = Array.from(root.getElementsByTagName("layer")).map(node => {
			let dataNode = node.getElementsByTagName("data")[0];
			var encoding = dataNode.getAttribute("encoding");

			let data;
			switch (encoding) {
				case "csv":
					data = dataNode.textContent?.split(",").map((x: string) => parseInt(x))
						?? unreachable();
					break;
				case "base64":
					let buffer = base64.toByteArray(dataNode.textContent?.trim() ?? unreachable()).buffer;
					let dataview = new DataView(buffer);
					data = range(buffer.byteLength / 4).map(i => dataview.getUint32(4 * i, true));
					break;
				default:
					throw new Error("Unsupported encoding for TML layer data.");
			}

			return { name: node.getAttribute("name") ?? unreachable(), data };
		});

		return new TiledMap(width, height, tilewidth, tileheight, tilesets, layers);
	};

	private getTilesetByGid(gid: number): Tileset {
		for (let tileSetId = this.tilesets.length - 1; tileSetId >= 0; --tileSetId)
			if (this.tilesets[tileSetId].firstgid <= gid) return this.tilesets[tileSetId];
		throw "No tile set found for gid " + gid;
	}

	drawLayer(batch: SpriteBatch, layer: Layer): void {
		const data = layer.data;
		for (let row = 0, rows = this.height, y = 0; row < rows; ++row, y += this.tileheight) {
			for (let col = 0, cols = this.width, x = 0; col < cols; ++col, x += this.tilewidth) {
				let gid = data[col + row * this.width];
				if (gid === 0) continue;

				const tileset = this.getTilesetByGid(gid);
				const x1 = x, y1 = y, x2 = x1 + this.tilewidth, y2 = y1 + this.tileheight,
					sx = tileset.getTileX(gid), sy = tileset.getTileY(gid),
					imageWidth = tileset.texture.width, imageHeight = tileset.texture.height,
					u1 = sx / imageWidth, v1 = sy / imageHeight,
					u2 = (sx + tileset.tilewidth) / imageWidth,
					v2 = (sy + tileset.tileheight) / imageHeight;

				batch.draw(tileset.texture.texture, x1, y1, x2, y2, u1, v1, u2, v2);
			}
		}
	}

	getLayerIdByName(name: string): number {
		for (var i = 0, length = this.layers.length; i < length; i++) {
			if (this.layers[i].name === name) return i;
		}
		throw new Error("Map has no layer called " + name + ".");
	}
}
