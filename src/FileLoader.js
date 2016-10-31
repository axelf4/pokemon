// window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
// window.URL = window.URL || webkitURL;

const storeName = "data";

function loadBlobXMLHttpRequest(url) {
	return new Promise((resolve, reject) => {
		var oReq;
		try {
			oReq = new (window.XMLHttpRequest || ActiveXObject("MSXML2.XMLHTTP.3.0"));
		} catch (e) { reject(e);}
		// Open a GET request and prevent caching
		oReq.open("GET", url + ((/\?/).test(url) ? "&" : "?") + (new Date()).getTime());
		oReq.mozRequestType = oReq.responseType = "blob";
		const expected = (document.URL.indexOf('file:') === 0) ? 0 : 200; // The expected status
		oReq.onreadystatechange = () => {
			if (oReq.readyState === 4 /* complete */) {
				if (oReq.status === 200 || oReq.status === expected) {
					console.log("Downloaded asset " + url + ".");
					resolve(oReq.mozResponse || oReq.response);
				} else {
					console.error("XMLHttpRequest failed with status " + oReq.status + ".");
					reject();
				}
			}
		};
		oReq.send();
	});
}

export default class FileLoader {
	constructor(dbName) {
		this.db = null;
		var request = indexedDB.open(dbName, 1);
		request.onerror = event => {
			console.error("Error opening database: ", event);
		};
		request.onblocked = event => {
			alert("Database request blocked. Please close other instances of this page.");
		};
		request.onsuccess = event => {
			this.db = event.target.result;
			console.log("IndexedDB opened successfully.");
		};
		request.onupgradeneeded = event => {
			const db = event.target.result;
			if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName);
		};
	}

	/**
	 * Loads a Blob from url.
	 */
	load(url) {
		var db = this.db;
		return new Promise((resolve, reject) => {
			if (!this.db) {
				// If the DB hasn't been opened or created yet
				loadBlobXMLHttpRequest(url).then(resolve);
			} else {
				var readRequest = db.transaction(storeName).objectStore(storeName).get(url);
				readRequest.onsuccess = event => {
					var value = event.target.result;
					if (value) {
						console.log("Found cached download of asset " + url + ".");
						resolve(value);
					} else {
						loadBlobXMLHttpRequest(url).then(function(blob) {
							var writeRequest = db.transaction(storeName, "readwrite").objectStore(storeName).put(blob, url);
							resolve(blob);
						});
					}
				};
				readRequest.onerror = reject;
			}
		});
	}
}
