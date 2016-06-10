var Widget = require("Widget.js");
var MeasureSpec = require("MeasureSpec.js");
var isWhitespace = require("isWhitespace.js");

var Label = function(font, text) {
	Widget.call(this);
	this.font = font;
	this.text = text || "";
};
Label.prototype = Object.create(Widget.prototype);
Label.prototype.constructor = Label;

Label.prototype.setText = function(text) {
	this.text = text;
	this.invalidateHierarchy();
};

var computeVisibleGlyphs = function(font, str, start, end, maxAdvance) {
	var index = start;
	var advance = 0;
	for (; index < end; ++index) {
		var glyph = font.getGlyph(str.charCodeAt(index));
		advance += glyph.xadvance;
		if (advance > maxAdvance) break;
	}
	return index - start;
};

Label.prototype.layout = function(widthMeasureSpec, heightMeasureSpec) {
	var wrappingWidth = 0;
	if (widthMeasureSpec.getMode() === MeasureSpec.exactly || widthMeasureSpec.getMode() === MeasureSpec.atMost) wrappingWidth = widthMeasureSpec.getSize();

	var glyphLines = this.glyphLines = [];
	var advance = 0;
	var last = start;
	var maxWidth = 0;
	var numLines = 0;

	var start = 0;
	var end = this.text.length;
	for (var index = start; index < end; ++index) {
		var addLine = false;
		var ch = this.text.charAt(index);
		var nextLast;

		if (ch === '\n') {
			addLine = true;
			nextLast = index + 1;
		} else {
			var charCode = ch.charCodeAt();
			var glyph = this.font.getGlyph(charCode);

			advance += glyph.xadvance;
			if (advance > wrappingWidth) {
				// Find a spot to wrap
				var cursor = index;
				while (cursor > last) {
					if (isWhitespace(this.text.charAt(cursor))) break;
					--cursor;
				}
				if (cursor !== last) {
					// A place to break on was found
					index = cursor;
					nextLast = index + 1;
				} else {
					nextLast = index + 0;
				}

				addLine = true;
			}
		}

		if (addLine || !(index + 1 < end)) {
			glyphLines.push({
				x: 0,
				start: last,
				end: index,
				str: this.text.substring(last, index),
			});

			var lineWidth = this.font.getBounds(this.text, last, index).width;
			maxWidth = Math.max(maxWidth, lineWidth);
			numLines++;

			advance = 0;
			last = nextLast;
			// while (isWhitespace(this.text.charAt(index + 1))) ++index; // Strip whitespace at the beginning of the next line
		}
	}

	var width = maxWidth;
	var height = this.font.lineHeight * numLines;
	this.setDimension(width, height);
};

Label.prototype.draw = function(batch) {
	var y = this.y;
	for (var i = 0; i < this.glyphLines.length; ++i) {
		var line = this.glyphLines[i];
		this.font.drawText(batch, this.x + line.x, y, line.str);
		y += this.font.lineHeight;
	}
};

module.exports = Label;
