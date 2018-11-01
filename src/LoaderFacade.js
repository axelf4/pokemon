import { loadTexture, TexRegion } from "texture";
var map = require("map");

window.URL = window.URL || window.webkitURL;

var LoaderFacade = function(fileLoader) {
	this.fileLoader = fileLoader;
};

LoaderFacade.prototype.load = function(src) {
	return this.fileLoader.load(src);
};

LoaderFacade.prototype.loadText = function(url) {
	return this.load(url).then(blob => new Promise((resolve, reject) => {
			var reader = new FileReader();
			reader.addEventListener("load", function() {
				resolve(reader.result);
			}, false);
			reader.onerror = reject;
			reader.readAsText(blob);
		})
	);
};

const xmlDocumentFromString = window.DOMParser ? function(string) {
	return new window.DOMParser().parseFromString(string, "text/xml");
} : typeof window.ActiveXObject != "undefined" && new window.ActiveXObject("Microsoft.XMLDOM") ? function(string) {
	var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
	xmlDoc.async = "false";
	xmlDoc.loadXML(xmlStr);
	return xmlDoc;
} : null;

/**
 * Returns a DOM tree from a URL.
 */
LoaderFacade.prototype.loadXML = function(url) {
	return this.load(url)
		.then(blob => {
			return new Promise(function(resolve, reject) {
				var reader = new FileReader();
				reader.onload = function(event) {
					var string = event.target.result;
					var document = xmlDocumentFromString(string);
					resolve(document);
				};
				reader.onerror = reject;
				reader.readAsText(blob);
			});
		});
};

LoaderFacade.prototype.loadJSON = function(url) {
	return this.load(url)
		.then(blob => {
			return new Promise(function(resolve, reject) {
				var reader = new FileReader();
				reader.onload = function(event) {
					resolve(JSON.parse(event.target.result));
				};
				reader.onerror = reject;
				reader.readAsText(blob);
			});
		});
};

LoaderFacade.prototype.loadTexture = function(src) {
	return this.load(src).then(blob => {
		const objectUrl = URL.createObjectURL(blob);
		return loadTexture(objectUrl).finally(() => { URL.revokeObjectURL(objectUrl); });
	});
};

LoaderFacade.prototype.loadTexturePlaceholder = function(src) {
	const region = TexRegion.getPlaceholder();
	this.loadTexture(src).then(loadedRegion => {
		Object.assign(region, loadedRegion);
	});
	return region;
};

LoaderFacade.prototype.loadMap = function(url) {
	return map.loadMap(this, url);
};

/**
 * Loads a script in the scripts directory.
 */
LoaderFacade.prototype.loadScript = function(path) {
	return new Promise(function(resolve, reject) {
		require(["./scripts/" + path], function(script) {
			resolve(script);
		});
	});
};

module.exports = LoaderFacade;
