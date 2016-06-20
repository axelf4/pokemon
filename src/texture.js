var gl = require("renderer.js").gl;
var loader = require("loader.js");

function isPowerOfTwo(x) {
	return (x & (x - 1)) == 0;
}

function nextHighestPowerOfTwo(x) {
	--x;
	for (var i = 1; i < 32; i <<= 1) {
		x = x | x >> i;
	}
	return x + 1;
}

var loadTexture = function(src, callback) {
	loader.start();
	var texture = gl.createTexture();
	var image = new Image();
	image.crossOrigin = "anonymous";
	var self = this;
	image.onload = function() {
		if (!isPowerOfTwo(image.width) || !isPowerOfTwo(image.height)) {
			// Scale up the texture to the next highest power of two dimensions.
			var canvas = document.createElement("canvas");
			canvas.width = nextHighestPowerOfTwo(image.width);
			canvas.height = nextHighestPowerOfTwo(image.height);
			var ctx = canvas.getContext("2d");
			ctx.drawImage(image, 0, 0, image.width, image.height);
			image = canvas;
		}
		gl.bindTexture(gl.TEXTURE_2D, texture);
		// gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		// gl.generateMipmap(gl.TEXTURE_2D);
		if (callback) callback(texture, image.width, image.height);
		loader.end();
	};
	image.src = src;
	return texture;
};

var TextureRegion = function(texture, x, y, width, height) {
	this.texture = texture;
	this.x = x || 0;
	this.y = y || 0;
	this.width = width || 0;
	this.height = height || 0;
};
TextureRegion.prototype.loadFromFile = function(src, callback) {
	var self = this;
	loadTexture(src, function(texture, width, height) {
		self.texture = texture;
		self.width = width;
		self.height = height;
		if (callback) callback();
	});
};
TextureRegion.prototype.setRegion = function(x, y, width, height) {
	this.x = x || 0;
	this.y = y || 0;
	this.width = width || texture.width;
	this.height = height || texture.height;
};
TextureRegion.prototype.getU1 = function() {
};

module.exports = {
	loadTexture: loadTexture,
	Region: TextureRegion,
};
