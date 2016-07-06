var parse = require("parse-bmfont-ascii");
var texture = require("texture.js");

var log2PageSize = 9;
var pageSize = 1 << log2PageSize;
var pages = 0x10000 / pageSize;

// TODO add support for keming

var Font = function(loader) {
	this.glyphs = new Array(pages);
	this.pageTextures = [];

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
			texturePromises.push(loader.loadTextureRegion("assets/" + page).then(textureRegion => {
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
	var texture = this.pageTextures[glyph.page].texture;

	var x1 = x + glyph.xoffset, x2 = x1 + glyph.width,
	y1 = y + glyph.yoffset, y2 = y1 + glyph.height;

	var u1 = glyph.x / 256;
	var v1 = glyph.y / 256;
	var u2 = (glyph.x + glyph.width) / 256;
	var v2 = (glyph.y + glyph.height) / 256;

	batch.draw(texture, x1, y1, x2, y2, u1, v1, u2, v2);
};

Font.prototype.drawText = function(batch, x, y, text) {
	var drawX = x, drawY = y;
	for (var i = 0, length = text.length; i < length; i++) {
		var glyphId = text.charCodeAt(i);
		var glyph = this.getGlyph(glyphId);
		var texture = this.pageTextures[glyph.page].texture;

		var x1 = drawX + glyph.xoffset, x2 = x1 + glyph.width,
		y1 = drawY + glyph.yoffset, y2 = y1 + glyph.height;

		var u1 = glyph.x / 256;
		var v1 = glyph.y / 256;
		var u2 = (glyph.x + glyph.width) / 256;
		var v2 = (glyph.y + glyph.height) / 256;

		batch.draw(texture, x1, y1, x2, y2, u1, v1, u2, v2);

		drawX += glyph.xadvance;
	}
};

Font.prototype.getBounds = function(text, start, end) {
	var advance = 0;
	for (var index = start; index < end; ++index) {
		var glyph = this.getGlyph(text.charCodeAt(index));
		advance += glyph.xadvance;
	}
	return {
		width: advance,
		height: this.lineHeight
	};
};

module.exports = Font;
