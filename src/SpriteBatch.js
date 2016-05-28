var renderer = require("renderer.js");
var gl = renderer.gl;

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
		// indices[i + 3] = j + 2;
		// indices[i + 4] = j + 3;
		// indices[i + 5] = j;
		indices[i + 3] = j;
		indices[i + 4] = j + 2;
		indices[i + 5] = j + 3;
	}
	this.indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);


	this.program = renderer.createProgram({
		vertexShader: require("vertex.glsl"),
		fragmentShader: require("fragment.glsl"),
	});
	gl.useProgram(this.program);
	this.vertexPositionAttribute = gl.getAttribLocation(this.program, "aVertexPosition");
	this.textureCoordAttribute = gl.getAttribLocation(this.program, "aTextureCoord");
	this.projectionMatrixUniform = gl.getUniformLocation(this.program, "uPMatrix");
	this.mvMatrixUniform = gl.getUniformLocation(this.program, "uMVMatrix");
	gl.uniform1i(gl.getUniformLocation(this.program, "uSampler"), 0);
};

SpriteBatch.prototype.flush = function() {
	gl.useProgram(this.program);
	gl.uniformMatrix4fv(this.projectionMatrixUniform, false, this.projectionMatrix);
	gl.uniformMatrix4fv(this.mvMatrixUniform, false, this.mvMatrix);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.lastTexture);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
	gl.enableVertexAttribArray(this.vertexPositionAttribute);
	gl.vertexAttribPointer(this.vertexPositionAttribute, 2, gl.FLOAT, false, 16, 0);
	gl.enableVertexAttribArray(this.textureCoordAttribute);
	gl.vertexAttribPointer(this.textureCoordAttribute, 2, gl.FLOAT, false, 16, 8);

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

	this.vertices[this.idx] = x1;
	this.vertices[this.idx + 1] = y1;
	this.vertices[this.idx + 2] = u1;
	this.vertices[this.idx + 3] = v1;

	this.vertices[this.idx + 4] = x2;
	this.vertices[this.idx + 5] = y1;
	this.vertices[this.idx + 6] = u2;
	this.vertices[this.idx + 7] = v1;

	this.vertices[this.idx + 8] = x2;
	this.vertices[this.idx + 9] = y2;
	this.vertices[this.idx + 10] = u2;
	this.vertices[this.idx + 11] = v2;

	this.vertices[this.idx + 12] = x1;
	this.vertices[this.idx + 13] = y2;
	this.vertices[this.idx + 14] = u1;
	this.vertices[this.idx + 15] = v2;

	this.idx += 16;
};

module.exports = SpriteBatch;
