var renderer = require("renderer.js");
var gl = renderer.gl;

var program = renderer.createProgram({
	vertexShader: require("vertex.glsl"),
	fragmentShader: require("fragment.glsl"),
});
gl.useProgram(program);
var vertexPositionAttribute = gl.getAttribLocation(program, "aVertexPosition");
gl.enableVertexAttribArray(vertexPositionAttribute);
var textureCoordAttribute = gl.getAttribLocation(program, "aTextureCoord");
gl.enableVertexAttribArray(textureCoordAttribute);
gl.uniform1i(gl.getUniformLocation(program, "uSampler"), 0);
var projectionMatrixUniform = gl.getUniformLocation(program, "uPMatrix");
var mvMatrixUniform = gl.getUniformLocation(program, "uMVMatrix");

var SpriteBatch = function(capacity) {
	capacity = capacity || 800;
	var spriteSize = 16;
	this.size = spriteSize * capacity;
	this.idx = 0;

	this.vertices = new Float32Array(this.size);
	this.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);

	var len = capacity * 6;
	var indices = new Uint16Array(len);
	for (var i = 0, j = 0; i < len; i += 6, j += 4) {
		indices[i] = j;
		indices[i + 1] = j + 1;
		indices[i + 2] = j + 2;
		indices[i + 3] = j + 2;
		indices[i + 4] = j + 3;
		indices[i + 5] = j;
	}
	this.indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
};
SpriteBatch.prototype.flush = function() {
	if (this.idx == 0) return;

	gl.useProgram(program);
	gl.uniformMatrix4fv(projectionMatrixUniform, false, this.projectionMatrix);
	gl.uniformMatrix4fv(mvMatrixUniform, false, this.mvMatrix);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.lastTexture);

	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
	gl.vertexAttribPointer(vertexPositionAttribute, 2, gl.FLOAT, false, 16, 0);
	gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 16, 8);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

	gl.drawElements(gl.TRIANGLES, this.idx / 16 * 6, gl.UNSIGNED_SHORT, 0);

	this.idx = 0;
};
SpriteBatch.prototype.switchTexture = function(texture) {
	if (this.lastTexture !== texture) this.flush();
	this.lastTexture = texture;
};
SpriteBatch.prototype.draw = function(texture, x1, y1, x2, y2, u1, v1, u2, v2) {
	if (texture !== this.lastTexture) this.switchTexture(texture);
	else if (this.idx === this.size) {
		this.flush();
	}

	this.vertices[this.idx++] = x1;
	this.vertices[this.idx++] = y1;
	this.vertices[this.idx++] = u1;
	this.vertices[this.idx++] = v1;

	this.vertices[this.idx++] = x2;
	this.vertices[this.idx++] = y1;
	this.vertices[this.idx++] = u2;
	this.vertices[this.idx++] = v1;

	this.vertices[this.idx++] = x2;
	this.vertices[this.idx++] = y2;
	this.vertices[this.idx++] = u2;
	this.vertices[this.idx++] = v2;

	this.vertices[this.idx++] = x1;
	this.vertices[this.idx++] = y2;
	this.vertices[this.idx++] = u1;
	this.vertices[this.idx++] = v2;
};

module.exports = SpriteBatch;
