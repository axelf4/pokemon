var xhrError = function() { console.error(this.statusText); };
var loadFile = function(url, callback, type) {
	var xhr = new XMLHttpRequest();
	xhr.callback = callback;
	xhr.addEventListener("load", callback);
	xhr.onerror = xhrError;
	xhr.open("get", url);
	xhr.send(null);
};

module.exports = {
	loadFile: loadFile,
};
