var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

var loadAudio = function(manager, url, callback) {
	manager.start();
	manager.loadXMLHttpRequest(url, "arraybuffer", function(audioData) {
		audioCtx.decodeAudioData(audioData, function(buffer) {
			callback(buffer);
			manager.end();
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
