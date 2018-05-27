var parse = require("parse-bmfont-ascii");
var texture = require("texture.js");

var log2PageSize = 9;
var pageSize = 1 << log2PageSize;
var pages = 0x10000 / pageSize;

// TODO add support for keming

var Font = function(loader) {
	this.glyphs = new Array(pages);
	this.pageTextures = [];
	this.scale = 2;

	var self = this;

	for (var i = 0; i < pages; i++) this.glyphs[i] = [];

	loader.loadText("assets/font.fnt").then(text => {
		var font = self.font = parse(text);
		self.lineHeight = font.common.lineHeight;
		font.chars.forEach(glyph => {
			this.setGlyph(glyph.id, glyph);
		});
		var texturePromises = [];
		font.pages.forEach((page, index) => {
			texturePromises.push(loader.loadTexture("assets/" + page).then(textureRegion => {
				this.pageTextures[index] = textureRegion;
			}));
		});
		return Promise.all(texturePromises);
	});
};

Font.prototype.setGlyph = function(id, glyph) {
	this.glyphs[Math.floor(id / pageSize)][id & pageSize - 1] = glyph;
};

Font.prototype.getGlyph = function(id) {
	return this.glyphs[Math.floor(id / pageSize)][id & pageSize - 1];
};

Font.prototype.drawGlyph = function(batch, x, y, glyph) {
	throw new Error("not yet implemented");
	var glyphId = text.charCodeAt(i);
	var glyph = this.getGlyph(glyphId);
	const region = this.pageTextures[glyph.page];

	var x1 = x + glyph.xoffset * this.scale, x2 = x1 + glyph.width * this.scale,
	y1 = y + glyph.yoffset * this.scale, y2 = y1 + glyph.height * this.scale;

	var u1 = glyph.x / region.width;
	var v1 = glyph.y / region.height;
	var u2 = (glyph.x + glyph.width) / region.width;
	var v2 = (glyph.y + glyph.height) / region.height;

	batch.draw(region.texture, x1, y1, x2, y2, u1, v1, u2, v2);
};

Font.prototype.drawText = function(batch, x, y, text) {
	const scale = this.scale;
	var drawX = x, drawY = y;
	for (var i = 0, length = text.length; i < length; i++) {
		var glyphId = text.charCodeAt(i);
		var glyph = this.getGlyph(glyphId);
		const region = this.pageTextures[glyph.page];

		var x1 = drawX + glyph.xoffset * scale, x2 = x1 + glyph.width * scale,
		y1 = drawY + glyph.yoffset * scale, y2 = y1 + glyph.height * scale;

		var u1 = glyph.x / region.width;
		var v1 = glyph.y / region.height;
		var u2 = (glyph.x + glyph.width) / region.width;
		var v2 = (glyph.y + glyph.height) / region.height;

		batch.draw(region.texture, x1, y1, x2, y2, u1, v1, u2, v2);

		drawX += glyph.xadvance * scale;
	}
};

Font.prototype.getLineHeight = function() {
	return this.lineHeight * this.scale;
};

Font.prototype.getBounds = function(text, start, end) {
	var advance = 0;
	for (var index = start; index < end; ++index) {
		var glyph = this.getGlyph(text.charCodeAt(index));
		advance += glyph.xadvance;
	}
	return {
		width: advance * this.scale,
		height: this.lineHeight * this.scale
	};
};

module.exports = Font;
