window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
window.URL = window.URL || webkitURL;

const storeName = "data";

var FileLoader = function(dbName) {
	var self = this;
	this.db = null;
	var request = indexedDB.open(dbName, 1);
	request.onerror = function(event) {
		console.error("Error opening database: ", event);
	};
	request.onblocked = function(event) {
		alert("Database request blocked. Please close other instances of this page.");
	};
	request.onsuccess = function(event) {
		self.db = this.result;
		console.log("IndexedDB opened successfully.");
	};
	request.onupgradeneeded = function(event) {
		var db = event.target.result;
		if (!db.objectStoreNames.contains(storeName)) {
			var store = db.createObjectStore(storeName);
		}
	};
};

/**
 * Loads a Blob from url.
 */
FileLoader.prototype.load = function(url) {
	var db = this.db;
	var decodedURI = decodeURIComponent(url);
	var self = this;
	return new Promise((resolve, reject) => {
		var loadBlobXMLHttpRequest = function(url) {
			return new Promise(function(resolve, reject) {
				var oReq;
				if (window.XMLHttpRequest) {
					oReq = new window.XMLHttpRequest;
				} else {
					try {
						oReq = new ActiveXObject("MSXML2.XMLHTTP.3.0");
					} catch (e) { reject(e); }
				}
				oReq.open("GET", url + ((/\?/).test(url) ? "&" : "?") + (new Date()).getTime());
				oReq.mozRequestType = oReq.responseType = "blob";
				var expected = (document.URL.indexOf('file:') === 0) ? 0 : 200; // The expected status
				oReq.onreadystatechange = () => {
					if (oReq.readyState === 4 /* complete */) {
						if (oReq.status === 200 || oReq.status === expected) {
							console.log("Downloaded asset " + decodedURI + ".");
							resolve(oReq.mozResponse || oReq.response);
						} else {
							console.error("XMLHttpRequest failed with status " + oReq.status + ".");
							reject();
						}
					}
				};
				oReq.send();
			});
		};

		if (this.db === null) {
			// If the DB hasn't been opened or created yet
			loadBlobXMLHttpRequest(url).then(resolve);
		} else if (this.db !== null) {
			var readRequest = db.transaction(storeName).objectStore(storeName).get(url);
			readRequest.onsuccess = function(event) {
				var value = event.target.result;
				if (value) {
					console.log("Found cached download of asset " + decodedURI + ".");
					resolve(value);
				} else {
					loadBlobXMLHttpRequest(url).then(function(blob) {
						var writeRequest = db.transaction(storeName, "readwrite").objectStore(storeName).put(blob, url);
						resolve(blob);
					});
				}
			};
			readRequest.onerror = function(event) {
				reject(event);
			};
		}
	});
};

module.exports = FileLoader;
