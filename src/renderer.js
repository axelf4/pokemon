var canvas = document.getElementById("canvas");
if (!canvas) {
	var canvas = document.createElement("canvas");
	canvas.width = 640;
	canvas.height = 480;
	document.body.appendChild(canvas);
}
var gl;
try {
	gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl"); // Try to grab the standard context. If it fails, fallback to experimental.
}
catch (e) {}
// If we don't have a GL context, give up now
if (!gl) alert("Unable to initialize WebGL. Your browser may not support it.");

gl.clearColor(0.0, 0.0, 0.0, 1.0);
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

var Texture = function() {};

module.exports = {
	canvas: canvas,
	gl: gl,
	createShader: createShader,
	createProgram: createProgram,
};
