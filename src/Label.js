var Widget = require("Widget.js");
var measureSpec = require("measureSpec.js");
var isWhitespace = require("isWhitespace.js");
var align = require("align.js");

var Label = function(font, text) {
	Widget.call(this);
	this.font = font;
	this.text = text || "";
	this.lastDisplayedIndex = this.text.length;
	this.displayUpTo = this.text.length; // Used to animate text
	this.justify = this.align = align.START;
};
Label.prototype = Object.create(Widget.prototype);
Label.prototype.constructor = Label;

Label.prototype.setText = function(text) {
	this.text = text;
	this.displayUpTo = text.length;
	this.requestLayout();
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
	var widthMode = measureSpec.getMode(widthMeasureSpec);
	var heightMode = measureSpec.getMode(heightMeasureSpec);
	var widthSize = measureSpec.getSize(widthMeasureSpec);
	var heightSize = measureSpec.getSize(heightMeasureSpec);

	var wrappingWidth = 0;
	if (widthMode === measureSpec.EXACTLY || widthMode === measureSpec.AT_MOST) {
		wrappingWidth = widthSize;
	}
	var maxLines;
	if (heightMode === measureSpec.EXACTLY || heightMode === measureSpec.AT_MOST) {
		maxLines = Math.floor(heightSize / this.font.getLineHeight());
	}

	var glyphLines = this.glyphLines = [];
	var advance = 0;
	var maxWidth = 0;
	var numLines = 0;
	var start = 0;
	var last = start;
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
			if (!glyph) console.log("Missing glyph for", charCode, "corresponds to", ch);

			advance += glyph.xadvance * this.font.scale;
			if (wrappingWidth && advance > wrappingWidth) {
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

		var lastCharInString = !(index + 1 < end);
		if (addLine || lastCharInString) {
			var endIndex = lastCharInString ? index + 1 : index;

			var lineWidth = this.font.getBounds(this.text, last, endIndex).width;
			maxWidth = Math.max(maxWidth, lineWidth);

			glyphLines.push({
				x: 0,
				start: last,
				end: endIndex,
				lineWidth: lineWidth,
				str: this.text.substring(last, endIndex),
			});

			numLines++;
			advance = 0;
			last = nextLast;
			this.lastDisplayedIndex = endIndex;
			// while (isWhitespace(this.text.charAt(index + 1))) ++index; // Strip whitespace at the beginning of the next line

			if (maxLines !== undefined && numLines >= maxLines) break;
		}
	}

	var width = maxWidth;
	if (widthMode === measureSpec.EXACTLY) width = widthSize;
	var height = this.font.getLineHeight() * numLines;
	var contentHeight = height;
	if (heightMode === measureSpec.EXACTLY) height = heightSize;
	this.setDimension(width, height);

	// Align content
	if (this.align !== align.START) {
		for (var i = 0, length = glyphLines.length; i < length; ++i) {
			var glyphLine = glyphLines[i];
			if (this.align === align.END) glyphLine.x = width - glyphLine.lineWidth;
			else if (this.align === align.CENTER) glyphLine.x = (width - glyphLine.lineWidth) / 2;
			else throw new Error("Invalid value for align.");
		}
	}
	this.offsetY = 0;
	switch (this.justify) {
		case align.START: break;
		case align.END:
			this.offsetY = height - contentHeight;
			break;
		case align.CENTER:
			this.offsetY = (height - contentHeight) / 2;
			break;
		default:
			throw new Error("Invalid value for justify.");
	}
};

Label.prototype.draw = function(batch) {
	var y = this.y + this.offsetY;
	let numCharsDrawn = 0;
	for (var i = 0; i < this.glyphLines.length; ++i) {
		var line = this.glyphLines[i];
		let str = line.str.substring(0, this.displayUpTo - numCharsDrawn);
		this.font.drawText(batch, this.x + line.x, y, str);
		y += this.font.getLineHeight();
		numCharsDrawn += str.length;
	}
};

Label.prototype.isShowingWholePage = function() { return this.displayUpTo >= this.lastDisplayedIndex; }

Label.prototype.showAllText = function() {
	if (this.isShowingWholePage()) return false;
	this.displayUpTo = this.lastDisplayedIndex;
	return true;
};

/**
 * Tries to advance visible text and returns if successful.
 *
 * If the size of the label is too small some text might not be visible. In
 * that case this function can advance the text so that the following text is
 * showed instead.
 */
Label.prototype.advance = function() {
	if (this.lastDisplayedIndex === this.text.length) return false;
	this.setText(this.text.slice(this.lastDisplayedIndex + 1));
	return true;
};

module.exports = Label;
