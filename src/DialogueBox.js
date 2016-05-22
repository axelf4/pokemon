var DialogueBoxLayout = function() {
};

DialogueBoxLayout.prototype.layout = function(item) {
	var width = item.width, height = item.height;
	if (!width) item.width = 640;
	if (!height) item.height = 100;
};

var DialogueBox = function(ninePatchTexture, ninePatch, font, text, callback) {
	this.manager = new DialogueBoxLayout();
	this.ninePatchTexture = ninePatchTexture;
	this.ninePatch = ninePatch;
	this.font = font;
	this.text = text;
	this.callback = callback;
};

DialogueBox.prototype.draw = function(batch) {
	this.ninePatch.draw(batch, this.ninePatchTexture.texture, this.left, this.top, this.width, this.height);

	this.font.drawText(batch, this.left + 9, this.top + 9, this.text);
};

module.exports = {
	DialogueBox: DialogueBox,
};
