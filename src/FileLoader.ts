/** The name of the database. */
const dbName = "game-assets";
/** The name of the object store where assets are cached. */
const storeName = "data";

/**
 * File loader that caches downloads in an IndexedDB.
 */
export default class FileLoader {
	private constructor(private readonly db?: IDBDatabase) {}

	static create(dbVersion: number): Promise<FileLoader> {
		return new Promise((resolve, _) => {
			let request = indexedDB.open(dbName, dbVersion);
			request.onerror = event => {
				console.error("Error opening database: ", event);
				resolve(new FileLoader(undefined));
			};
			request.onblocked = event => {
				alert("Database request blocked. Please close other instances of this page.");
			};
			request.onsuccess = event => {
				console.log("IndexedDB opened successfully.");
				resolve(new FileLoader((event.target as IDBOpenDBRequest)!.result as IDBDatabase));
			};
			request.onupgradeneeded = event => {
				const db = (event.target as IDBOpenDBRequest)!.result;

				db.createObjectStore(storeName);
			};
		});
	}

	/**
	 * Loads a Blob given its URL.
	 */
	load(url: string): Promise<Blob> {
		return new Promise((resolve, reject) => {
			if (!this.db)
				throw new Error("Database is unavailable");

			let readRequest = this.db.transaction(storeName).objectStore(storeName).get(url);
			readRequest.onsuccess = event => {
				let value = (event.target as IDBRequest)!.result;
				if (value) {
					console.debug("Found cached download of asset", url);
					resolve(value);
				} else {
					reject(new Error(`Asset not in database: ${url}`));
				}
			};
			readRequest.onerror = reject;
		})
			.catch(e => {
				// If not found locally: Fetch
				return fetch(url, {cache: "no-store"})
					.then(response => {
						if (!response.ok)
							throw new Error(`Unsuccessful response (${response.statusText}): ${url}`);
						return response.blob();
					})
					.then(blob => { // Cache download in database
						this.db?.transaction(storeName, "readwrite")
							.objectStore(storeName)
							.put(blob, url);
						return blob;
					});
			}) as Promise<Blob>;
	}
}
