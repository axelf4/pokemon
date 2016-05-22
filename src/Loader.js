var renderer = require("renderer.js");
var gl = renderer.gl;

var onerror = function() {
	console.error(this.statustext);
};

module.exports = {
	loading: 0,
	onstart: null,
	onload: null,
	start: function() {
		this.loading++;
		if (this.onstart) this.onstart();
	},
	end: function() {
		this.loading--;
		if (!this.loading && this.onload) this.onload();
	},
	check: function() {
		if (!this.loading && this.onload) this.onload();
	},
	load: function(url, callback, type) {
		this.start();
		var xhr = new XMLHttpRequest();
		xhr.callback = callback;
		xhr.addEventListener("load", callback);
		var self = this;
		xhr.addEventListener("load", function() {
			self.end();
		});
		xhr.onerror = onerror;
		xhr.open("get", url);
		xhr.send(null);
	},
	loadXMLHttpRequest: function(url, responseType, callback) {
		this.start();
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url, true);
		xhr.responseType = responseType; // Set the responseType to blob
		var self = this;
		if (responseType === "document") xhr.overrideMimeType('text/xml'); // force the response to be parsed as XML
		xhr.addEventListener("load", function() {
			callback.apply(this);
			// Put the received file into IndexedDB
			// db.transaction(["assets"], "readwrite").objectStore("assets").put(blob, asset.name); // Put the blob into the database
			self.end();
		}, false);
		xhr.onerror = function(event) {
			throw new Error("XMLHttpRequest encountered an error: " + event);
		};
		xhr.send(); // Send XHR
	},
	loadFile: function(url, callback) {
		this.loadXMLHttpRequest(url, "blob", function() {
			var reader = new FileReader();
			reader.onload = function(e) {
				callback(e.target.result);
			};
			reader.readAsDataURL(this.response);
		});
	},
	loadJSON: function(url, callback) {
		this.loadXMLHttpRequest(url, "json", callback);
	},
	loadImage: function(texture, url) {
		this.start();
		var self = this;
		this.loadFile(url, function(file) {
			texture.loadFromFile(self, file);
			self.end();
		});
	},
};
