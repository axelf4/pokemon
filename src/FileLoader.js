// window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
// window.URL = window.URL || webkitURL;

const storeName = "data";

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
		return (this.db ? new Promise((resolve, reject) => {
			let readRequest = this.db.transaction(storeName).objectStore(storeName).get(url);
			readRequest.onsuccess = event => {
				let value = event.target.result;
				if (value) {
					console.log("Found cached download of asset " + url + ".");
					resolve(value);
				} else {
					reject(new Error("Asset not in database"));
				}
			};
			readRequest.onerror = reject;
		}) : Promise.reject(new Error("Database now available yet")))
		// If not found locally: Fetch
			.catch(e => fetch(url, {cache: "no-store"}).then(response => response.blob())
				// Cache download in database
				.then(blob => {
					if (this.db)
						this.db.transaction(storeName, "readwrite").objectStore(storeName).put(blob, url);
					return blob;
				})
			);
	}
}
