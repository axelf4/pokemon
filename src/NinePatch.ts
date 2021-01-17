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

		const x0 = texRegion.u1 * texWidth, y0 = texRegion.v1 * texHeight,
			x1 = texRegion.u2 * texWidth, y1 = texRegion.v2 * texHeight;

		const pixels = new Uint8Array(4 * (x1 - x0) * (y1 - y0));

		const fb = gl.createFramebuffer(); // Create framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, fb); // Make it the current
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
		if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
			throw new Error("These framebuffers man. Ain't working no more.");
		gl.readPixels(x0, y0, x1, y1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.deleteFramebuffer(fb);

		function scanLine(i0: number, i1: number,
						  pixelFunc: (i: number) => number): { start: number, end: number } {
			let start = i1, end = i0;
			for (let i = i0; i < i1; ++i) {
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
		const top = scanLine(x0, x1, i => i);
		const left = scanLine(y0, y1, i => i * texWidth);
		const patches: Patches = [
			{ x: 1, y: 1, width: top.start - 1, height: left.start - 2 }, // top left
			{ x: top.start, y: 1, width: top.end - top.start, height: left.start - 2 }, // top middle
			{ x: top.end + 1, y: 1, width: x1 - top.end - 2, height: left.start - 2 }, // top right
			{ x: 1, y: left.start, width: top.start - 1, height: left.end - left.start }, // middle left
			{ x: top.start, y: left.start, width: top.end - top.start, height: left.end - left.start }, // middle center
			{ x: top.end + 1, y: left.start, width: x1 - top.end - 2, height: left.end - left.end }, // middle right
			{ x: 1, y: left.end + 1, width: top.start - 1, height: y1 - left.end - 2 }, // bottom left
			{ x: top.start, y: left.end + 1, width: top.end - top.start, height: y1 - left.end - 2 }, // bottom middle
			{ x: top.end + 1, y: left.end + 1, width: x1 - top.end - 2, height: y1 - left.end - 2 } // bottom right
		];
		return new NinePatch(texRegion.texture, patches);
	}
}
