import {mat4} from "gl-matrix";
const pack = require("rgba-to-float"),
	  renderer = require("renderer");
import { TexRegion } from "./texture";

const gl = renderer.gl;

export class Color {
	constructor(readonly r: number,
				readonly g: number,
				readonly b: number,
				readonly a = 1) {}

	static fromAlpha(a: number): Color {
		return new this(1, 1, 1, a);
	}
}

export const white = new Color(1, 1, 1, 1);

/** The number of vertex elements per sprite. */
const spriteSize = 20;

export default class SpriteBatch {
	private size: number;
	private idx = 0;
	private drawing = false;

	private vertices: Float32Array;
	private vertexBuffer: WebGLBuffer;
	private indexBuffer: WebGLBuffer;

	private program: WebGLProgram;
	private customProgram?: WebGLProgram;

	private projectionMatrix = mat4.create();
	private transformMatrix = mat4.create();
	private matrix = mat4.create();

	private vertexPositionAttribute: GLint;
	private textureCoordAttribute: GLint;
	private colorAttribute: GLint;
	private mvpMatrixUniform: GLint;

	private lastTexture?: WebGLTexture;
	
	constructor(private readonly capacity = 128) {
		this.size = spriteSize * capacity;

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

			uniform mat4 uMvpMatrix;

			varying vec2 vTextureCoord;
			varying vec4 vColor;

			void main(void) {
				vTextureCoord = aTextureCoord;
				vColor = aColor;
				// vColor.a = aColor.a * (255.0 / 254.0);
				gl_Position = uMvpMatrix * vec4(aVertexPosition, 0.0, 1.0);
			}`,
		fragmentShaderSource = `
			precision mediump float;
			varying vec2 vTextureCoord;
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
		this.vertexPositionAttribute = gl.getAttribLocation(this.program, "aVertexPosition");
		this.textureCoordAttribute = gl.getAttribLocation(this.program, "aTextureCoord");
		this.colorAttribute = gl.getAttribLocation(this.program, "aColor");
		this.mvpMatrixUniform = gl.getUniformLocation(this.program, "uMvpMatrix");
		gl.uniform1i(gl.getUniformLocation(this.program, "uTexture"), 0);
	}

	private setupMatrices(): void {
		mat4.multiply(this.matrix, this.projectionMatrix, this.transformMatrix);
		let uniformLocation = this.customProgram
			? gl.getUniformLocation(this.customProgram, "uMvpMatrix")
			: this.mvpMatrixUniform;
		gl.uniformMatrix4fv(uniformLocation, false, this.matrix);
	}

	begin(): void {
		if (this.drawing) throw new Error("end must be called before begin.");
		this.drawing = true;
		gl.depthMask(false);
		gl.activeTexture(gl.TEXTURE0);

		let vertexPositionAttribute, textureCoordAttribute, colorAttribute;
		if (this.customProgram) {
			vertexPositionAttribute = gl.getAttribLocation(this.customProgram, "aVertexPosition");
			textureCoordAttribute = gl.getAttribLocation(this.customProgram, "aTextureCoord");
			colorAttribute = gl.getAttribLocation(this.customProgram, "aColor");
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
		if (colorAttribute !== -1) {
			gl.enableVertexAttribArray(colorAttribute);
			gl.vertexAttribPointer(colorAttribute, 4, gl.UNSIGNED_BYTE, true, 20, 16);
		}
	}

	private flush(): void {
		if (this.idx === 0) return;
		gl.bindTexture(gl.TEXTURE_2D, this.lastTexture);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
		gl.drawElements(gl.TRIANGLES, this.idx / 20 * 6, gl.UNSIGNED_SHORT, 0);
		this.idx = 0;
	}

	end(): void {
		if (!this.drawing) throw new Error("begin must be called before end.");
		this.flush();

		let vertexPositionAttribute, textureCoordAttribute, colorAttribute;
		if (this.customProgram) {
			vertexPositionAttribute = gl.getAttribLocation(this.customProgram, "aVertexPosition");
			textureCoordAttribute = gl.getAttribLocation(this.customProgram, "aTextureCoord");
			colorAttribute = gl.getAttribLocation(this.customProgram, "aColor");
		} else {
			vertexPositionAttribute = this.vertexPositionAttribute;
			textureCoordAttribute = this.textureCoordAttribute;
			colorAttribute = this.colorAttribute;
		}
		gl.disableVertexAttribArray(vertexPositionAttribute);
		gl.disableVertexAttribArray(textureCoordAttribute);
		if (colorAttribute !== -1) gl.disableVertexAttribArray(colorAttribute);

		this.drawing = false;
	}

	setProgram(program?: WebGLProgram): void {
		if (this.drawing) {
			throw new Error("Changing programs while drawing is currently not supported.");
			this.flush();
		}
		this.customProgram = program;
		if (this.drawing) {
			gl.useProgram(this.customProgram ?? this.program);
			this.setupMatrices();
		}
	}

	draw(texture: WebGLTexture, x1: number, y1: number, x2: number, y2: number,
		 u1: number, v1: number, u2: number, v2: number, color = white): void {
		if (!this.drawing) throw new Error("SpriteBatch.begin must be called before draw.");
		if (texture !== this.lastTexture) {
			this.flush();
			this.lastTexture = texture;
		} else if (this.idx === this.size) {
			this.flush();
		}
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

		this.idx += spriteSize;

		this.flush();
	}

	setProjectionMatrix(matrix: mat4): void {
		if (this.drawing) this.flush();
		this.projectionMatrix = matrix;
		if (this.drawing) this.setupMatrices();
	}

	getTransformMatrix(): mat4 {
		return this.transformMatrix;
	}

	setTransformMatrix(matrix: mat4): void {
		if (this.drawing) this.flush();
		this.transformMatrix = matrix;
		if (this.drawing) this.setupMatrices();
	}
};
