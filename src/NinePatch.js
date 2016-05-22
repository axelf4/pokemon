"use strict";
var renderer = require("renderer");
var Region = require("Region.js");
var gl = renderer.gl;

var NinePatch = function(texture, patches) {
	this.texture = texture;
	this.patches = patches;
};

NinePatch.prototype.drawPatch = function(batch, texture, patch, x, y, width, height) {
	var u1 = patch.x / 32;
	var v1 = patch.y / 32;
	var u2 = (patch.x + patch.width) / 32;
	var v2 = (patch.y + patch.height) / 32;
	batch.draw(texture, x, y, x + width, y + height, u1, v1, u2, v2);
};
NinePatch.prototype.draw = function(batch, texture, x, y, width, height) {
	var leftWidth = this.patches[0].width;
	var rightWidth = this.patches[2].width;
	var upperHeight = this.patches[0].height;
	var lowerHeight = this.patches[6].height;
	var centerWidth = width - (leftWidth + rightWidth);
	var centerHeight = height - (upperHeight + lowerHeight);
	if (centerWidth < 0 || centerHeight < 0) throw new RangeError("Specified size is too small for nine-patch image.");

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

NinePatch.fromTexture = function(texture, width, height) {
	var fb = gl.createFramebuffer(); // Create framebuffer
	gl.bindFramebuffer(gl.FRAMEBUFFER, fb); // Make it the current
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
	if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
		alert("These framebuffers man. Ain't working no more.");
		return null;
	}
	var pixels = new Uint8Array(width * height * 4);
	gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	var scanLine = function(length, pixelFunc) {
		var black = 0xFF;
		var start = length, end = 0;
		for (var i = 0; i < length; i++) {
			var pixel = pixelFunc(i) * 4;
			var value;
			if ((value = (pixels[pixel] << 32
							| pixels[pixel + 1] << 16
							| pixels[pixel + 2] << 8
							| pixels[pixel + 3])) === black) {
				if (start > i) start = i;
				if (end < i) end = i;
			}
		}
		return {
			start: start,
			end: end
		};
	};
	var top = scanLine(width, function(i) { return i; });
	var left = scanLine(height, function(i) { return i * width; });
	var patches = [
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
	return new NinePatch(texture, patches);
};

module.exports = NinePatch;
