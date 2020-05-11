import State from "State";
import * as stateManager from "stateManager";
import * as renderer from "./renderer";
import { isPowerOfTwo, nextPowerOfTwo } from "pow2";

var gl = renderer.gl;

const vertexShaderSource =
"attribute vec2 aVertexPosition;" +
"attribute vec2 aTextureCoord;" +
"attribute vec2 aColor;" +

"uniform mat4 uPMatrix;" +

"varying highp vec2 vTextureCoord;" +

"void main(void) {" +
"	vTextureCoord = aTextureCoord + 0.0 * aColor;" +
"	gl_Position = uPMatrix * vec4(aVertexPosition, 0.0, 1.0);" +
"}";
const fragmentShaderSource =
"precision mediump float;" +
"varying highp vec2 vTextureCoord;" +
"uniform sampler2D uSampler;" +
"uniform sampler2D uCutoffTex;" +
"uniform float uCutoff;" +
"uniform float uFade;" +
"uniform vec3 uColor;" +
"uniform vec2 invResolution;" +

"void main(void) {" +
"	vec2 suv = gl_FragCoord.xy * invResolution;" +
"	float cutoff = float(texture2D(uCutoffTex, suv).r > uCutoff);" +
"	gl_FragColor = texture2D(uSampler, vTextureCoord) * cutoff;" +
"	gl_FragColor = mix(gl_FragColor, vec4(uColor, 1.0), uFade);" +
"}";

export const fade = (state, t) => ({ cutoffTexture: renderer.whiteTexture, c: 0, f: t, r: 0, g: 0, b: 0 });

export const reverse = transition => (state, t) => transition(state, 1 - t);

export const outIn = (a, b) => (state, t) => (state === TRANSITION_FADE_OUT ? a : b)(state, t);

export function createWipeIn(loader) {
	return loader.loadTexture("assets/transition2.png").then(texRegion =>
		(state, t) => ({ cutoffTexture: texRegion.texture, c: t, f: 0, r: 0, g: 0, b: 0 })
	);
}

export function createBattleTransition(loader) {
	return Promise.all([
		loader.loadTexture("assets/transition.png").then(region => region.texture),
		createWipeIn(loader)
	]).then(result => {
			const [cutoffTexture, wipeIn] = result;
			return outIn((state, t) => {
				const flashCount = 2
				const flashDuration = 0.15;
				const ft = flashCount * flashDuration;
				const sin = Math.sin, abs = Math.abs;
				if (t < ft) {
					return { cutoffTexture: renderer.whiteTexture, c: 0,
						f: abs(sin(Math.PI * t / flashDuration)), r: 1, g: 1, b: 1 };
				}

				return { cutoffTexture, c: (t - ft) / (1 - ft),
					f: 0, r: 0, g: 0, b: 0 };
			}, wipeIn);
		});
}

const TRANSITION_WAIT = 1;
const TRANSITION_FADE_OUT = 2;
const TRANSITION_FADE_IN = 3;

export default class TransitionState extends State {
	constructor(state, transition) {
		super();
		this.state = state;
		this.transition = transition;
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

		const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
		if (status !== gl.FRAMEBUFFER_COMPLETE) {
			throw 'Bad framebuffer';
		}

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		this.program = renderer.createProgram({
			vertexShader: vertexShaderSource,
			fragmentShader: fragmentShaderSource
		});
		gl.useProgram(this.program);
		gl.uniform1i(gl.getUniformLocation(this.program, "uSampler"), 0);
		gl.uniform1i(gl.getUniformLocation(this.program, "uCutoffTex"), 1);
		this.cutoffLocation = gl.getUniformLocation(this.program, "uCutoff");
		this.fadeLocation = gl.getUniformLocation(this.program, "uFade");
		this.colorLocation = gl.getUniformLocation(this.program, "uColor");
		this.invResolutionLocation = gl.getUniformLocation(this.program, "invResolution");

		this.timer = 0;
		this.transitionState = state ? TRANSITION_FADE_OUT: TRANSITION_WAIT;
		this.finishListeners = [];
	}

	addFinishTransitionListener(listener) {
		this.finishListeners.push(listener);
	}

	transitionTo(state) {
		if (!state) throw new Error("State should not be falsy.");
		if (this.state) {
			this.toState = state;
		} else {
			this.state = state;
			this.state.resize(this.width, this.height);
			this.transitionState = TRANSITION_FADE_IN;
		}
	}

	draw(batch, dt, time) {
		const interval = 1000;
		if (this.transitionState === TRANSITION_FADE_OUT
				|| this.transitionState === TRANSITION_FADE_IN) {
			this.timer += dt;
		}
		let t;
		switch (this.transitionState) {
			case TRANSITION_WAIT: t = 1; break;
			case TRANSITION_FADE_OUT: t = Math.min(this.timer / interval, 1); break;
			case TRANSITION_FADE_IN: t = 1 - Math.min(this.timer / interval, 1); break;
		}
		const { cutoffTexture, c, f, r, g, b } = this.transition(this.transitionState, t);
		if (this.timer > interval) {
			this.timer = 0;
			this.finishListeners.forEach(listener => listener());
			if (this.transitionState === TRANSITION_FADE_OUT) {
				if (this.toState) {
					this.state = this.toState;
					this.state.resize(this.width, this.height);
					this.transitionState = TRANSITION_FADE_IN;
				} else {
					this.state = null;
					this.transitionState = TRANSITION_WAIT;
				}
			} else if (this.transitionState === TRANSITION_FADE_IN) {
				this.transitionState = TRANSITION_WAIT;
				stateManager.setState(this.state);
			}
		}

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
		gl.viewport(0, 0, this.width, this.height);
		if (this.state) {
			this.state.draw(batch, dt, time);
		} else {
			gl.clearColor(0, 0, 0, 1);
			gl.clear(gl.COLOR_BUFFER_BIT);
		}
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		renderer.viewport2DrawingBuffer();

		batch.setProgram(this.program);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, cutoffTexture);
		batch.begin();

		gl.uniform1f(this.cutoffLocation, c);
		gl.uniform1f(this.fadeLocation, f);
		gl.uniform3f(this.colorLocation, r, g, b);
		let {width: viewportWidth, height: viewportHeight} = renderer.drawingBufferSize();
		gl.uniform2f(this.invResolutionLocation, 1 / viewportWidth, 1 / viewportHeight);

		const u2 = this.width / this.texWidth, v2 = this.height / this.texHeight;
		batch.draw(this.texture, 0, 0, this.width, this.height, 0, v2, u2, 0);

		batch.end();
		batch.setProgram(null);
	}

	resize(width, height) {
		super.resize(width, height);
		if (this.state)
			this.state.resize(width, height);

		this.texWidth = isPowerOfTwo(width) ? width : nextPowerOfTwo(width);
		this.texHeight = isPowerOfTwo(height) ? height : nextPowerOfTwo(height);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.texWidth, this.texHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	}
}
