var loader = require("loader.js");

var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

var loadAudio = function(url, callback) {
	loader.start();
	loader.loadXMLHttpRequest(url, "arraybuffer", function() {
		audioCtx.decodeAudioData(this.response, function(buffer) {
			callback(buffer);
			loader.end();
		}); // function(e) { console.log("Error with decoding audio data" + e.err);
	});
};
var playAudio = function(buffer) {
	var source = audioCtx.createBufferSource();
	source.buffer = buffer;
	source.connect(audioCtx.destination);
	source.start();
	return source;
};

module.exports = {
	loadAudio: loadAudio,
	playAudio: playAudio,
};
