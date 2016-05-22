var parse = require("parse-bmfont-ascii");
var texture = require("texture.js");
var loader = require("loader.js");

var log2PageSize = 9;
var pageSize = 1 << log2PageSize;
var pages = 0x10000 / pageSize;

var Font = function() {
	this.glyphs = new Array(pages);
	this.pageTextures = [];

	var self = this;

	for (var i = 0; i < pages; i++) this.glyphs[i] = [];

	loader.loadXMLHttpRequest("assets/font.fnt", "text", function() {
		var font = parse(this.response);
		font.pages.forEach(function(page, index) {
			var textureRegion = new texture.Region();
			self.pageTextures[index] = textureRegion;
			textureRegion.loadFromFile("assets/" + page);
		});
		font.chars.forEach(function(glyph) {
			self.setGlyph(glyph.id, glyph);
		});
	});
};
Font.prototype.setGlyph = function(id, glyph) {
	this.glyphs[Math.floor(id / pageSize)][id & pageSize - 1] = glyph;
};

Font.prototype.getGlyph = function(id) {
	return this.glyphs[Math.floor(id / pageSize)][id & pageSize - 1];
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

module.exports = Font;
