const renderer = require("renderer.js"), gl = renderer.gl;
import { isPowerOfTwo, nextPowerOfTwo } from "./pow2";
import SpriteBatch, { white } from "./SpriteBatch";

export default interface Texture {
	texture: WebGLTexture;
	width: number;
	height: number;
};

export function loadTexture(src: string): Promise<TexRegion> {
	return new Promise((resolve, reject) => {
		let image = new Image();
		image.crossOrigin = "anonymous";
		image.onload = function() {
			const regionWidth = image.width, regionHeight = image.height;
			let img: HTMLImageElement | HTMLCanvasElement = image;
			if (!isPowerOfTwo(image.width) || !isPowerOfTwo(image.height)) {
				// Scale up the texture to the next highest power of two dimensions.
				const canvas = document.createElement("canvas");
				canvas.width = nextPowerOfTwo(image.width);
				canvas.height = nextPowerOfTwo(image.height);
				const ctx = canvas.getContext("2d");
				if (ctx === null) throw new Error("Context identifier '2d' is not supported");
				ctx.drawImage(image, 0, 0, image.width, image.height);
				img = canvas;
			}
			const texture = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, texture);
			// gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

			resolve(new TexRegion({ texture, width: img.width, height: img.height },
									0, 0, regionWidth, regionHeight));
		};
		image.onerror = reject;
		image.src = src;
	});
}

export class TexRegion {
	u1: number;
	v1: number;
	u2: number;
	v2: number;

	constructor(readonly texture: Texture,
				x0 = 0, y0 = 0, x1 = texture.width, y1 = texture.height) {
		this.u1 = x0 / texture.width;
		this.v1 = y0 / texture.height;
		this.u2 = x1 / texture.width;
		this.v2 = y1 / texture.height;
	}

	draw(batch: SpriteBatch, x1: number, y1: number, x2: number, y2: number,
		 color = white): void {
		batch.draw(this.texture.texture, x1, y1, x2, y2,
				   this.u1, this.v1, this.u2, this.v2, color);
	}
}

export function getPlaceholderTexture(): TexRegion {
	return new TexRegion(renderer.whiteTexture, 0, 0, 1, 1);
}
