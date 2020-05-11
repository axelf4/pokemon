export const canvas = function() {
	let canvas = document.getElementById("canvas");
	if (!canvas) {
		const body = document.body;
		body.style.marginLeft = body.style.marginTop = body.style.marginRight = body.style.marginBottom = 0;
		canvas = document.createElement("canvas");
		canvas.style.width = "100vw";
		canvas.style.height = "100vh";
		canvas.style.display = "block";
		document.body.appendChild(canvas);
	}
	return canvas;
}();

export const gl = function() {
	try {
		// Try to grab the standard context. If it fails, fallback to experimental.
		return canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
	} catch (e) {}
	// If we don't have a GL context, give up now
	alert("Unable to initialize WebGL. Your browser may not support it.");
}();

/** Returns the size of the canvas in pixels. */
export function getSize() {
	const devicePixelRatio = window.devicePixelRatio || 1;
	return {
		width: canvas.clientWidth * devicePixelRatio | 0,
		height: canvas.clientHeight * devicePixelRatio | 0,
	};
}

/** Returns the size of the drawing buffer. */
export function drawingBufferSize() {
	return { width: gl.drawingBufferWidth, height: gl.drawingBufferHeight };
}

export function viewport2DrawingBuffer() {
	gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
}

export function sizeCanvas() {
	const {width, height} = getSize();
	if (canvas.width !== width || canvas.height !== height) {
		canvas.width = width;
		canvas.height = height;
		viewport2DrawingBuffer();
		return true;
	}
	return false;
}

export function toggleFullscreen() {
	if (document.fullscreenElement || document.mozFullScreenElement
		|| document.msFullscreenElement || document.webkitFullscreenElement)
		(document.exitFullscreen || document.mozCancelFullScreen
			|| document.msExitFullscreen || document.webkitExitFullscreen).call(document);
	else {
		((canvas.requestFullscreen || canvas.mozRequestFullScreen
			|| canvas.msRequestFullscreen || canvas.webkitRequestFullScreen).call(canvas)
			|| Promise.resolve())
			.catch(e => { alert(`Error attempting to enable full-screen mode: ${e.message} (${e.name})`); });
	}
}

gl.disable(gl.DEPTH_TEST);
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

export function getShaderFromDOM(gl, id) {
	const shaderScript = document.getElementById(id);
	if (!shaderScript) return null;
	let source = "", currentChild = shaderScript.firstChild;
	while (currentChild) {
		if (currentChild.nodeType == currentChild.TEXT_NODE) source += currentChild.textContent;
		currentChild = currentChild.nextSibling;
	}
	let shader;
	if (shaderScript.type == "x-shader/x-fragment") shader = gl.createShader(gl.FRAGMENT_SHADER);
	else if (shaderScript.type == "x-shader/x-vertex") shader = gl.createShader(gl.VERTEX_SHADER);
	else return null; // Unknown shader type
	gl.shaderSource(shader, source);
	gl.compileShader(shader); // Compile the shader program
	// See if it compiled successfully
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
		return null;
	}
	return shader;
}

export function createShader(type, source) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader); // Compile the shader program
	// See if it compiled successfully
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
		throw gl.getShaderInfoLog(shader);
	return shader;
}

export function createProgram(params) {
	const program = gl.createProgram(); // Create the shader program
	gl.attachShader(program, createShader(gl.VERTEX_SHADER, params.vertexShader));
	gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, params.fragmentShader));
	gl.linkProgram(program);
	// If creating the shader program failed, alert
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) alert("Unable to initialize the shader program.");
	return program;
}

export const whiteTexture = (function() {
	const whiteTextureData = new Uint8Array(1);
	whiteTextureData[0] = 0xFF;
	const whiteTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, whiteTexture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 1, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, whiteTextureData);
	return whiteTexture;
})();
