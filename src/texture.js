var gl = require("renderer.js").gl;
import { isPowerOfTwo, nextHighestPowerOfTwo } from "pow2";

export function loadTexture(src) {
	return new Promise((resolve, reject) => {
		let image = new Image();
		image.crossOrigin = "anonymous";
		image.onload = function() {
			const regionWidth = image.width, regionHeight = image.height;
			if (!isPowerOfTwo(image.width) || !isPowerOfTwo(image.height)) {
				// Scale up the texture to the next highest power of two dimensions.
				const canvas = document.createElement("canvas");
				canvas.width = nextHighestPowerOfTwo(image.width);
				canvas.height = nextHighestPowerOfTwo(image.height);
				const ctx = canvas.getContext("2d");
				ctx.drawImage(image, 0, 0, image.width, image.height);
				image = canvas;
			}
			const texture = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, texture);
			// gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

			resolve(new TexRegion(texture, 0, 0, regionWidth, regionHeight, image.width, image.height));
		};
		image.onerror = reject;
		image.src = src;
	});
}

export class TexRegion {
	constructor(texture, x0, y0, x1, y1, width, height) {
		if (arguments.length === 3) {
			width = x1 = x0;
			height = y1 = y0;
			x0 = y0 = 0;
		} else if (arguments.length !== 7) {
			throw new Error("Invalid number of arguments.");
		}
		this.texture = texture;
		this.width = width;
		this.height = height;
		this.x0 = x0;
		this.y0 = y0;
		this.x1 = x1;
		this.y1 = y1;
	}

	draw(batch, x, y, width, height) {
		batch.draw(this.texture, x, y, x + width, y + height,
				this.x0 / this.width, this.y0 / this.height,
				this.x1 / this.width, this.y1 / this.height);
	}
}
