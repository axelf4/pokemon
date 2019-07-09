import { loadTexture, TexRegion } from "texture";
import { loadMap } from "TiledMap";

window.URL = window.URL || window.webkitURL;

const xmlDocumentFromString = window.DOMParser ? function(string) {
	return new window.DOMParser().parseFromString(string, "text/xml");
} : typeof window.ActiveXObject != "undefined" && new window.ActiveXObject("Microsoft.XMLDOM") ? function(string) {
	const xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
	xmlDoc.async = "false";
	xmlDoc.loadXML(xmlStr);
	return xmlDoc;
} : null;

export default class LoaderFacade {
	constructor(fileLoader) {
		this.fileLoader = fileLoader;
	}

	load(src) {
		return this.fileLoader.load(src);
	}

	loadText(url) {
		return this.load(url).then(blob => new Promise((resolve, reject) => {
			var reader = new FileReader();
			reader.addEventListener("load", function() {
				resolve(reader.result);
			}, false);
			reader.onerror = reject;
			reader.readAsText(blob);
		}));
	}

	/**
	 * Returns a DOM tree from a URL.
	 */
	loadXML(url) {
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
	}

	loadJSON(url) {
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
	}

	loadTexture(src) {
		return this.load(src).then(blob => {
			const objectUrl = URL.createObjectURL(blob);
			return loadTexture(objectUrl).finally(() => { URL.revokeObjectURL(objectUrl); });
		});
	}

	loadTexturePlaceholder(src) {
		const region = TexRegion.getPlaceholder();
		this.loadTexture(src).then(loadedRegion => {
			Object.assign(region, loadedRegion);
		});
		return region;
	}

	loadMap(url) {
		return loadMap(this, url);
	}

	/**
	 * Loads a script in the scripts directory.
	 */
	loadScript(path) {
		return import("./scripts/" + path).then(module => module.default);
	}
}
