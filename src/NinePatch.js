var renderer = require("renderer");
var Region = require("Region.js");
var gl = renderer.gl;

export default class NinePatch {
	constructor(texRegion, patches) {
		this.texRegion = texRegion;
		this.patches = patches;
	}

	drawPatch(batch, texture, patch, x, y, width, height) {
		const u1 = patch.x / this.texRegion.width,
			v1 = patch.y / this.texRegion.height,
			u2 = (patch.x + patch.width) / this.texRegion.width,
			v2 = (patch.y + patch.height) / this.texRegion.height;
		batch.draw(texture, x, y, x + width, y + height, u1, v1, u2, v2);
	};

	draw(batch, x, y, width, height) {
		const texture = this.texRegion.texture,
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

	static fromTextureRegion(texRegion) {
		const fb = gl.createFramebuffer(); // Create framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, fb); // Make it the current
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texRegion.texture, 0);
		if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
			console.error("These framebuffers man. Ain't working no more.");
			return null;
		}
		const pixels = new Uint8Array(4 * (texRegion.x1 - texRegion.x0) * (texRegion.y1 - texRegion.y0));
		gl.readPixels(texRegion.x0, texRegion.y0, texRegion.x1, texRegion.y1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.deleteFramebuffer(fb);
		const scanLine = function(i0, i1, pixelFunc) {
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
		};
		const top = scanLine(texRegion.x0, texRegion.x1, i => i);
		const left = scanLine(texRegion.y0, texRegion.y1, i => i * texRegion.width);
		const width = texRegion.x1, height = texRegion.y1;
		const patches = [
			new Region(1, 1, top.start - 1, left.start - 2), // top left
			new Region(top.start, 1, top.end - top.start, left.start - 2), // top middle
			new Region(top.end + 1, 1, width - top.end - 2, left.start - 2), // top right
			new Region(1, left.start, top.start - 1, left.end - left.start), // middle left
			new Region(top.start, left.start, top.end - top.start, left.end - left.start), // middle center
			new Region(top.end + 1, left.start, width - top.end - 2, left.end - left.end), // middle right
			new Region(1, left.end + 1, top.start - 1, height - left.end - 2), // bottom left
			new Region(top.start, left.end + 1, top.end - top.start, height - left.end - 2), // bottom middle
			new Region(top.end + 1, left.end + 1, width - top.end - 2, height - left.end - 2) // bottom right
		];
		return new NinePatch(texRegion, patches);
	}
}
