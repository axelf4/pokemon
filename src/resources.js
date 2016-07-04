var loader = require("loader");
var texture = require("texture");
var NinePatch = require("NinePatch");
var font = require("font.js");

exports.font = new font();

exports.frame = null;
loader.loadFile("textures/frame.9.png", function(file) {
	var ninePatchTexture = new texture.Region();
	ninePatchTexture.loadFromFile(file, function() {
		exports.frame = NinePatch.fromTexture(ninePatchTexture.texture, 24, 24);
	});
});
