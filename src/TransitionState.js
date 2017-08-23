import State from "State";
import * as stateManager from "stateManager";
var renderer = require("renderer");
var pow2 = require("pow2");

var gl = renderer.gl;

const vertexShaderSource =
"attribute vec2 aVertexPosition;" +
"attribute vec2 aTextureCoord;" +

"uniform mat4 uMVMatrix;" +
"uniform mat4 uPMatrix;" +

"varying highp vec2 vTextureCoord;" +

"void main(void) {" +
"	vTextureCoord = aTextureCoord;" +
"	gl_Position = uPMatrix * vec4(aVertexPosition, 0.0, 1.0);" +
"}";
const fragmentShaderSource =
"precision mediump float;" +
"varying highp vec2 vTextureCoord;" +
"uniform sampler2D uSampler;" +
"uniform float uFade;" +

"void main(void) {" +
"	gl_FragColor = texture2D(uSampler, vTextureCoord) * vec4(uFade, uFade, uFade, 1);" +
"}";

const TRANSITION_WAIT = 1;
const TRANSITION_FADE_OUT = 2;
const TRANSITION_FADE_IN = 3;

export default class TransitionState extends State {
	constructor(state) {
		super();
		this.state = state;
		this.toState = null;

		this.texWidth = 1;
		this.texHeight = 1;

		this.texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.texWidth, this.texHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

		this.fbo = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		this.program = renderer.createProgram({
			vertexShader: vertexShaderSource,
			fragmentShader: fragmentShaderSource
		});
		gl.useProgram(this.program);
		gl.uniform1i(gl.getUniformLocation(this.program, "uSampler"), 0);
		this.fadeLocation = gl.getUniformLocation(this.program, "uFade");

		this.timer = 0;
		this.transitionState = TRANSITION_WAIT;
	}

	transitionTo(state) {
		if (this.state) {
			this.toState = state;
			this.transitionState = TRANSITION_FADE_OUT;
		} else {
			this.state = state;
			this.state.resize(this.width, this.height);
			this.transitionState = TRANSITION_FADE_IN;
		}
	}

	draw(batch, dt, time) {
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
		if (this.state) {
			this.state.draw(batch, dt, time);
		} else {
			// gl.clearColor(0, 0, 0, 1);
			// gl.clear(gl.COLOR_BUFFER_BIT);
		}
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		batch.setProgram(this.program);
		batch.begin();

		const interval = 1000;

		if (this.transitionState === TRANSITION_FADE_OUT
				|| this.transitionState === TRANSITION_FADE_IN) {
			this.timer += dt;
		}
		let fade;
		switch (this.transitionState) {
			case TRANSITION_WAIT: fade = 1; break;
			case TRANSITION_FADE_IN: fade = Math.min(this.timer / interval, 1); break;
			case TRANSITION_FADE_OUT: fade = 1 - Math.min(this.timer / interval, 1); break;
		}
		gl.uniform1f(this.fadeLocation, fade);
		if (this.timer > interval) {
			this.timer = 0;
			if (this.transitionState === TRANSITION_FADE_OUT) {
				if (!this.toState) throw new Exception("toState should not be falsy.");
				this.state = this.toState;
				this.state.resize(this.width, this.height);
				this.transitionState = TRANSITION_FADE_IN;
			} else if (this.transitionState === TRANSITION_FADE_IN) {
				this.transitionState = TRANSITION_WAIT;
				stateManager.setState(this.state);
			}
		}

		var u2 = this.width / this.texWidth, v2 = this.height / this.texHeight;
		batch.draw(this.texture, 0, 0, this.width, this.height, 0, v2, u2, 0);

		batch.end();
		batch.setProgram(null);
	}

	resize(width, height) {
		super.resize(width, height);
		if (this.state)
			this.state.resize(width, height);

		this.texWidth = pow2.isPowerOfTwo(width) ? width : pow2.nextHighestPowerOfTwo(width);
		this.texHeight = pow2.isPowerOfTwo(height) ? height : pow2.nextHighestPowerOfTwo(height);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.texWidth, this.texHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	}
}
