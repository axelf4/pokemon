var glMatrix = require("gl-matrix");
var renderer = require("renderer.js");

var mat4 = glMatrix.mat4;
var gl = renderer.gl;

var SpriteBatch = function(capacity) {
	capacity = capacity || 800;
	var spriteSize = 16;
	this.size = spriteSize * capacity;
	this.idx = 0;
	this.drawing = false;
	this.projectionMatrix = mat4.create();
	this.transformMatrix = mat4.create();
	this.matrix = mat4.create();

	this.vertices = new Float32Array(this.size);
	this.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STREAM_DRAW);

	var len = capacity * 6;
	var indices = new Uint16Array(len);
	for (var i = 0, j = 0; i < len; i += 6, j += 4) {
		indices[i] = j;
		indices[i + 1] = j + 1;
		indices[i + 2] = j + 2;
		indices[i + 3] = j;
		indices[i + 4] = j + 2;
		indices[i + 5] = j + 3;
	}
	this.indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

	var vertexShaderSource =
		"attribute vec2 aVertexPosition;" +
		"attribute vec2 aTextureCoord;" +

		"uniform mat4 uMVMatrix;" +
		"uniform mat4 uPMatrix;" +

		"varying highp vec2 vTextureCoord;" +

		"void main(void) {" +
		"	vTextureCoord = aTextureCoord;" +
		"	gl_Position = uPMatrix * vec4(aVertexPosition, 0.0, 1.0);" +
		"}";
	var fragmentShaderSource =
		"precision mediump float;" +
		"varying highp vec2 vTextureCoord;" +
		"uniform sampler2D uSampler;" +

		"void main(void) {" +
		"	gl_FragColor = texture2D(uSampler, vTextureCoord);" +
		"}";
	this.program = renderer.createProgram({
		vertexShader: vertexShaderSource,
		fragmentShader: fragmentShaderSource
	});
	gl.useProgram(this.program);
	this.customProgram = null;
	this.vertexPositionAttribute = gl.getAttribLocation(this.program, "aVertexPosition");
	this.textureCoordAttribute = gl.getAttribLocation(this.program, "aTextureCoord");
	this.projectionMatrixUniform = gl.getUniformLocation(this.program, "uPMatrix");
	gl.uniform1i(gl.getUniformLocation(this.program, "uSampler"), 0);
};

SpriteBatch.prototype.begin = function() {
	if (this.drawing) throw new Error("end must be called before begin.");
	this.drawing = true;

	gl.depthMask(false);

	var vertexPositionAttribute, textureCoordAttribute;

	if (this.customProgram !== null) {
		vertexPositionAttribute = gl.getAttribLocation(this.program, "aVertexPosition");
		textureCoordAttribute = gl.getAttribLocation(this.program, "aTextureCoord");
		gl.useProgram(this.customProgram);
	} else {
		vertexPositionAttribute = this.vertexPositionAttribute;
		textureCoordAttribute = this.textureCoordAttribute;
		gl.useProgram(this.program);
	}
	this.setupMatrices();

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.enableVertexAttribArray(this.vertexPositionAttribute);
	gl.vertexAttribPointer(this.vertexPositionAttribute, 2, gl.FLOAT, false, 16, 0);
	gl.enableVertexAttribArray(this.textureCoordAttribute);
	gl.vertexAttribPointer(this.textureCoordAttribute, 2, gl.FLOAT, false, 16, 8);

	gl.activeTexture(gl.TEXTURE0);
};

SpriteBatch.prototype.end = function() {
	if (!this.drawing) throw new Error("begin must be called before end.");
	this.flush();
	this.drawing = false;
};

SpriteBatch.prototype.flush = function() {
	if (this.idx === 0) return;

	gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);

	gl.bindTexture(gl.TEXTURE_2D, this.lastTexture);

	gl.drawElements(gl.TRIANGLES, this.idx / 16 * 6, gl.UNSIGNED_SHORT, 0);

	this.idx = 0;
};

SpriteBatch.prototype.setProgram = function(program) {
	if (this.drawing) {
		throw new Error("Changing programs while drawing is currently not supported.");
		this.flush();
	}
	this.customProgram = program;
	if (this.drawing) {
		if (this.customProgram !== null) {
			gl.useProgram(this.customProgram);
		} else {
			gl.useProgram(this.program);
		}
		this.setupMatrices();
	}
};

SpriteBatch.prototype.switchTexture = function(texture) {
	// TODO only flush when drawing
	if (this.lastTexture !== texture) this.flush();
	this.lastTexture = texture;
};

SpriteBatch.prototype.draw = function(texture, x1, y1, x2, y2, u1, v1, u2, v2) {
	if (!this.drawing) throw new Error("SpriteBatch.begin must be called before draw.");
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

SpriteBatch.prototype.setupMatrices = function() {
	mat4.multiply(this.matrix, this.projectionMatrix, this.transformMatrix);
	if (this.customProgram !== null) {
		var uniformLocation = gl.getUniformLocation(this.customProgram, "uPMatrix");
		gl.uniformMatrix4fv(uniformLocation, false, this.matrix);
	} else {
		gl.uniformMatrix4fv(this.projectionMatrixUniform, false, this.matrix);
	}
};

SpriteBatch.prototype.setProjectionMatrix = function(matrix) {
	if (this.drawing) this.flush();
	// mat4.copy(this.projectionMatrix, matrix);
	this.projectionMatrix = matrix;
	if (this.drawing) this.setupMatrices();
};

SpriteBatch.prototype.getTransformMatrix = function() {
	return this.transformMatrix;
};

SpriteBatch.prototype.setTransformMatrix = function(matrix) {
	if (this.drawing) this.flush();
	// mat4.copy(this.transformMatrix, matrix);
	this.transformMatrix = matrix;
	if (this.drawing) this.setupMatrices();
};

module.exports = SpriteBatch;
