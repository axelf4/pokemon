var renderer = require("renderer.js");
var gl = renderer.gl;

var LoadingManager = function() {
	this.loaded = this.total = 0;
};
LoadingManager.prototype.onload = null;
LoadingManager.prototype.start = function() {
	this.total++;
};
LoadingManager.prototype.end = function() {
	this.loaded++;
	console.log("Loaded " + this.loaded + " out of " + this.total + " (" + Math.round(this.loaded / this.total * 100) + "%).");
	if (this.loaded >= this.total) {
		if (this.onload) this.onload();
	}
};
LoadingManager.prototype.startLoading = function() {
	if (this.loaded >= this.total && this.onload) this.onload();
};
LoadingManager.prototype.loadXMLHttpRequest = function(url, responseType, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.responseType = responseType; // Set the responseType to blob
	xhr.addEventListener("load", function() {
		callback(this.response);
		// Put the received file into IndexedDB
		// db.transaction(["assets"], "readwrite").objectStore("assets").put(blob, asset.name); // Put the blob into the database
	}, false);
	xhr.onerror = function(event) {
		console.log("dem requests be mean, saying stuff like " + event);
	};
	xhr.send(); // Send XHR
};
LoadingManager.prototype.loadFile = function(url, callback) {
	this.loadXMLHttpRequest(url, "blob", function(response) {
		var reader = new FileReader();
		reader.onload = function(e) {
			callback(e.target.result);
		};
		reader.readAsDataURL(response);
	});
};
LoadingManager.prototype.loadJSON = function(url, callback) {
	this.loadXMLHttpRequest(url, "json", callback);
};

LoadingManager.prototype.loadImage = function(texture, url) {
	this.start();
	var self = this;
	this.loadFile(url, function(file) {
		texture.loadFromFile(self, file);
		self.end();
	});
};

/*LoadingManager.prototype.loadImageCache = function(url, callback) {
	this.start();
	var self = this;
	this.loadFile(url, function(file) {
		self.loadImageFromFile(file, callback);
		self.end();
	});
};*/

module.exports = LoadingManager;
