var canvas = document.getElementById("canvas");
if (!canvas) {
	var body = document.body;
	body.style.marginLeft = body.style.marginTop = body.style.marginRight = body.style.marginBottom = 0;
	canvas = document.createElement("canvas");
	canvas.style.width = "100vw";
	canvas.style.height = "100vh";
	canvas.style.display = "block";
	document.body.appendChild(canvas);
}
var gl;
try {
	gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl"); // Try to grab the standard context. If it fails, fallback to experimental.
}
catch (e) {}
// If we don't have a GL context, give up now
if (!gl) alert("Unable to initialize WebGL. Your browser may not support it.");

// reshape
var sizeCanvas = function() {
	if (canvas.clientWidth !== canvas.width || canvas.clientHeight !== canvas.height) {
		var devicePixelRatio = window.devicePixelRatio || 1;
		var width = canvas.clientWidth * devicePixelRatio, height = canvas.clientHeight * devicePixelRatio;
		canvas.width = width;
		canvas.height = height;
		gl.viewport(0, 0, width, height);
		return true;
	}
	return false;
};

var getWidth = function() {
	return canvas.width;
};

var getHeight = function() {
	return canvas.height;
};

gl.disable(gl.DEPTH_TEST);
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

var getShaderFromDOM = function(gl, id) {
	var shaderScript = document.getElementById(id);
	if (!shaderScript) return null;
	var source = "";
	var currentChild = shaderScript.firstChild;
	while(currentChild) {
		if (currentChild.nodeType == currentChild.TEXT_NODE) source += currentChild.textContent;
		currentChild = currentChild.nextSibling;
	}
	var shader;
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
};

var createShader = function(type, source) {
	var shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader); // Compile the shader program
	// See if it compiled successfully
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
		return null;
	}
	return shader;
};

var createProgram = function(params) {
	var program = gl.createProgram(); // Create the shader program
	gl.attachShader(program, createShader(gl.VERTEX_SHADER, params.vertexShader));
	gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, params.fragmentShader));
	gl.linkProgram(program);
	// If creating the shader program failed, alert
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) alert("Unable to initialize the shader program.");
	return program;
};

const whiteTextureData = new Uint8Array(1);
whiteTextureData[0] = 0xFF;
const whiteTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, whiteTexture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 1, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, whiteTextureData);

module.exports = {
	canvas: canvas,
	gl: gl,
	createShader: createShader,
	createProgram: createProgram,
	sizeCanvas: sizeCanvas,
	getWidth: getWidth,
	getHeight: getHeight,
	whiteTexture,
};
