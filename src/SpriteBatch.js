const glMatrix = require("gl-matrix"),
	  pack = require("rgba-to-float"),
	  renderer = require("renderer");

const mat4 = glMatrix.mat4,
	  gl = renderer.gl;

export class Color {
	constructor(r, g, b, a = 1) {
		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
	}
}

export const white = new Color(1, 1, 1, 1);

export default class SpriteBatch {
	constructor(capacity) {
		capacity = capacity || 128;
		const spriteSize = 20;
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

		const len = capacity * 6;
		const indices = new Uint16Array(len);
		for (let i = 0, j = 0; i < len; i += 6, j += 4) {
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

		const vertexShaderSource = `
			attribute vec2 aVertexPosition;
			attribute vec2 aTextureCoord;
			attribute vec4 aColor;

			uniform mat4 uMVMatrix;
			uniform mat4 uPMatrix;

			varying highp vec2 vTextureCoord;
			varying vec4 vColor;

			void main(void) {
				vTextureCoord = aTextureCoord;
				vColor = aColor;
				vColor.a = aColor.a * (255.0 / 254.0);
				gl_Position = uPMatrix * vec4(aVertexPosition, 0.0, 1.0);
			}`,
		fragmentShaderSource = `
			precision mediump float;
			varying highp vec2 vTextureCoord;
			varying vec4 vColor;
			uniform sampler2D uTexture;

			void main(void) {
				gl_FragColor = vColor * texture2D(uTexture, vTextureCoord);
			}`;
		this.program = renderer.createProgram({
			vertexShader: vertexShaderSource,
			fragmentShader: fragmentShaderSource
		});
		gl.useProgram(this.program);
		this.customProgram = null;
		this.vertexPositionAttribute = gl.getAttribLocation(this.program, "aVertexPosition");
		this.textureCoordAttribute = gl.getAttribLocation(this.program, "aTextureCoord");
		this.colorAttribute = gl.getAttribLocation(this.program, "aColor");
		this.projectionMatrixUniform = gl.getUniformLocation(this.program, "uPMatrix");
		gl.uniform1i(gl.getUniformLocation(this.program, "uTexture"), 0);
	}

	begin() {
		if (this.drawing) throw new Error("end must be called before begin.");
		this.drawing = true;
		gl.depthMask(false);
		gl.activeTexture(gl.TEXTURE0);

		let vertexPositionAttribute, textureCoordAttribute, colorAttribute;
		if (this.customProgram !== null) {
			vertexPositionAttribute = gl.getAttribLocation(this.program, "aVertexPosition");
			textureCoordAttribute = gl.getAttribLocation(this.program, "aTextureCoord");
			colorAttribute = gl.getAttribLocation(this.program, "aColor");
			gl.useProgram(this.customProgram);
		} else {
			vertexPositionAttribute = this.vertexPositionAttribute;
			textureCoordAttribute = this.textureCoordAttribute;
			colorAttribute = this.colorAttribute;
			gl.useProgram(this.program);
		}
		this.setupMatrices();

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.enableVertexAttribArray(vertexPositionAttribute);
		gl.vertexAttribPointer(vertexPositionAttribute, 2, gl.FLOAT, false, 20, 0);
		gl.enableVertexAttribArray(textureCoordAttribute);
		gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 20, 8);
		gl.enableVertexAttribArray(colorAttribute);
		gl.vertexAttribPointer(colorAttribute, 4, gl.UNSIGNED_BYTE, true, 20, 16);
	}

	end() {
		if (!this.drawing) throw new Error("begin must be called before end.");
		this.flush();
		gl.disableVertexAttribArray(this.vertexPositionAttribute);
		gl.disableVertexAttribArray(this.textureCoordAttribute);
		gl.disableVertexAttribArray(this.colorCoordAttribute);
		this.drawing = false;
	}

	flush() {
		if (this.idx === 0) return;
		gl.bindTexture(gl.TEXTURE_2D, this.lastTexture);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
		gl.drawElements(gl.TRIANGLES, this.idx / 20 * 6, gl.UNSIGNED_SHORT, 0);
		this.idx = 0;
	}

	setProgram(program) {
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
	}

	switchTexture(texture) {
		if (this.lastTexture !== texture) this.flush();
		this.lastTexture = texture;
	}

	draw(texture, x1, y1, x2, y2, u1, v1, u2, v2, color) {
		if (!this.drawing) throw new Error("SpriteBatch.begin must be called before draw.");
		if (texture !== this.lastTexture) this.switchTexture(texture);
		else if (this.idx === this.size) {
			this.flush();
		}
		color = color || white;
		const packedColor = pack(0xFF * color.r, 0xFF * color.g, 0xFF * color.b, 0xFF * color.a);

		this.vertices[this.idx] = x1;
		this.vertices[this.idx + 1] = y1;
		this.vertices[this.idx + 2] = u1;
		this.vertices[this.idx + 3] = v1;
		this.vertices[this.idx + 4] = packedColor;

		this.vertices[this.idx + 5] = x2;
		this.vertices[this.idx + 6] = y1;
		this.vertices[this.idx + 7] = u2;
		this.vertices[this.idx + 8] = v1;
		this.vertices[this.idx + 9] = packedColor;

		this.vertices[this.idx + 10] = x2;
		this.vertices[this.idx + 11] = y2;
		this.vertices[this.idx + 12] = u2;
		this.vertices[this.idx + 13] = v2;
		this.vertices[this.idx + 14] = packedColor;

		this.vertices[this.idx + 15] = x1;
		this.vertices[this.idx + 16] = y2;
		this.vertices[this.idx + 17] = u1;
		this.vertices[this.idx + 18] = v2;
		this.vertices[this.idx + 19] = packedColor;

		this.idx += 20;
	}

	setupMatrices() {
		mat4.multiply(this.matrix, this.projectionMatrix, this.transformMatrix);
		if (this.customProgram !== null) {
			var uniformLocation = gl.getUniformLocation(this.customProgram, "uPMatrix");
			gl.uniformMatrix4fv(uniformLocation, false, this.matrix);
		} else {
			gl.uniformMatrix4fv(this.projectionMatrixUniform, false, this.matrix);
		}
	}

	setProjectionMatrix(matrix) {
		if (this.drawing) this.flush();
		// mat4.copy(this.projectionMatrix, matrix);
		this.projectionMatrix = matrix;
		if (this.drawing) this.setupMatrices();
	}

	getTransformMatrix() {
		return this.transformMatrix;
	}

	setTransformMatrix(matrix) {
		if (this.drawing) this.flush();
		// mat4.copy(this.transformMatrix, matrix);
		this.transformMatrix = matrix;
		if (this.drawing) this.setupMatrices();
	}
};
