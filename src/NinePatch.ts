const renderer = require("renderer"), gl = renderer.gl;
import Texture, { TexRegion } from "./texture";
import SpriteBatch from "./SpriteBatch";

interface Region {
	x: number;
	y: number;
	width: number;
	height: number;
}

type Patches
	= [Region, Region, Region,
	   Region, Region, Region,
	   Region, Region, Region];

export default class NinePatch {
	constructor(private readonly texture: Texture,
				private readonly patches: Patches) {}

	private drawPatch(batch: SpriteBatch, texture: WebGLTexture, patch: Region,
		 x: number, y: number, width: number, height: number): void {
		const u1 = patch.x / this.texture.width,
			v1 = patch.y / this.texture.height,
			u2 = (patch.x + patch.width) / this.texture.width,
			v2 = (patch.y + patch.height) / this.texture.height;
		batch.draw(texture, x, y, x + width, y + height, u1, v1, u2, v2);
	};

	draw(batch: SpriteBatch, x: number, y: number, width: number, height: number): void {
		const texture = this.texture.texture,
			leftWidth = this.patches[0].width, rightWidth = this.patches[2].width,
			upperHeight = this.patches[0].height, lowerHeight = this.patches[6].height,
			centerWidth = width - (leftWidth + rightWidth),
			centerHeight = height - (upperHeight + lowerHeight);
		if (centerWidth < 0 || centerHeight < 0) {
			console.warn("Specified size is too small for nine-patch image.");
			return;
		}

		this.drawPatch(batch, texture, this.patches[0], x, y, leftWidth, upperHeight);
		this.drawPatch(batch, texture, this.patches[1], x + leftWidth, y, centerWidth, upperHeight);
		this.drawPatch(batch, texture, this.patches[2], x + leftWidth + centerWidth, y, rightWidth, upperHeight);

		this.drawPatch(batch, texture, this.patches[3], x, y + upperHeight, leftWidth, centerHeight);
		this.drawPatch(batch, texture, this.patches[4], x + leftWidth, y + upperHeight, centerWidth, centerHeight);
		this.drawPatch(batch, texture, this.patches[5], x + leftWidth + centerWidth, y + upperHeight, rightWidth, centerHeight);
		this.drawPatch(batch, texture, this.patches[6], x, y + upperHeight + centerHeight, leftWidth, lowerHeight);
		this.drawPatch(batch, texture, this.patches[7], x + leftWidth, y + upperHeight + centerHeight, centerWidth, lowerHeight);
		this.drawPatch(batch, texture, this.patches[8], x + leftWidth + centerWidth, y + upperHeight + centerHeight, rightWidth, lowerHeight);
	};

	static fromTextureRegion(texRegion: TexRegion): NinePatch {
		const {texture, width: texWidth, height: texHeight} = texRegion.texture;

		const x = texRegion.u1 * texWidth, y = texRegion.v1 * texHeight,
			w = texRegion.u2 * texWidth - x, h = texRegion.v2 * texHeight - y;

		const pixels = new Uint8Array(4 * w * h);

		const fb = gl.createFramebuffer(); // Create framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, fb); // Make it the current
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
		if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
			throw new Error("These framebuffers man. Ain't working no more.");
		gl.readPixels(x, y, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.deleteFramebuffer(fb);

		/**
		 * Returns start and end coordinates of the black line, both inclusive.
		 */
		function scanLine(len: number,
						  pixelFunc: (i: number) => number): { start: number, end: number } {
			let start = len, end = 0;
			for (let i = 1; i < len - 1; ++i) {
				const pixel = 4 * pixelFunc(i);
				if ((pixels[pixel] << 32
							| pixels[pixel + 1] << 16
							| pixels[pixel + 2] << 8
							| pixels[pixel + 3]) === 0xFF) {
					if (start > i) start = i;
					if (end < i) end = i;
				}
			}
			return { start, end };
		}
		const top = scanLine(w, i => i),
			left = scanLine(h, i => i * w);

		const patches: Patches = [
			{ x: x + 1, y: y + 1, width: top.start - 1, height: left.start - 2 }, // top left
			{ x: x + top.start, y: y + 1, width: top.end - top.start, height: left.start - 2 }, // top middle
			{ x: x + top.end + 1, y: y + 1, width: w - top.end - 2, height: left.start - 2 }, // top right
			{ x: x + 1, y: y + left.start, width: top.start - 1, height: left.end - left.start }, // middle left
			{ x: x + top.start, y: y + left.start, width: top.end - top.start, height: left.end - left.start }, // middle center
			{ x: x + top.end + 1, y: y + left.start, width: w - top.end - 2, height: left.end - left.end }, // middle right
			{ x: x + 1, y: y + left.end + 1, width: top.start - 1, height: h - left.end - 2 }, // bottom left
			{ x: x + top.start, y: y + left.end + 1, width: top.end - top.start, height: h - left.end - 2 }, // bottom middle
			{ x: x + top.end + 1, y: y + left.end + 1, width: w - top.end - 2, height: h - left.end - 2 } // bottom right
		];
		return new NinePatch(texRegion.texture, patches);
	}
}
