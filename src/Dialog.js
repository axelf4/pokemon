// msgbox
var NinePatch = require("NinePatch.js");
var Font = require("font.js");
var input = require("input.js");
var Widget = require("Widget.js");
var loader = require("loader.js");
var texture = require("texture.js");

// TODO move into skin
var font = new Font();
var ninePatchTexture, ninePatch;
loader.loadFile("textures/frame.9.png", function(file) {
	ninePatchTexture = new texture.Region();
	ninePatchTexture.loadFromFile(file, function() {
		ninePatch = NinePatch.fromTexture(ninePatchTexture.texture, 24, 24);
	});
});

var DialogLayout = function() {
};

DialogLayout.prototype.layout = function(item) {
	var width = item.width, height = item.height;
	if (!width) item.width = 640;
	if (!height) item.height = 100;
};

var Dialog = function(text, callback) {
	this.manager = new DialogLayout();
	this.text = text;
	this.callback = callback;
};
Dialog.prototype = Object.create(Widget.prototype);
Dialog.prototype.constructor = Dialog;

Dialog.prototype.update = function(dt, time, batch) {
	if (input.pressedKeys.indexOf(32) !== -1) {
		// TODO advance multipage text
		this.remove();
		this.callback();
	}

	ninePatch.draw(batch, ninePatchTexture.texture, this.left, this.top, this.width, this.height);

	font.drawText(batch, this.left + 9, this.top + 9, this.text);
};

module.exports = Dialog;
