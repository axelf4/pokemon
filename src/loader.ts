import FileLoader from "./FileLoader";
import { loadTexture, TexRegion, getPlaceholderTexture } from "./texture";
import TiledMap from "./TiledMap";
import { unreachable } from "./utils";

export function loadText(fileLoader: FileLoader, url: string): Promise<string> {
	return fileLoader.load(url).then(blob => new Promise((resolve, reject) => {
		let reader = new FileReader();
		reader.onload = event => {
			resolve((event.target as FileReader)!.result as string)
		};
		reader.onerror = reject;
		reader.readAsText(blob);
	}));
}

function isJsonUrl(url: string): url is `${string}.json` {
	return url.endsWith(".json");
}

export function loadJson(fileLoader: FileLoader, url: string): Promise<object> {
	return loadText(fileLoader, url).then(JSON.parse);
}

function isXmlUrl(url: string): url is `${string}.xml` {
	return url.endsWith(".xml");
}

/** Parses a XML document from the specified string. */
const xmlDocumentFromString: (s: string) => Document
	= window.DOMParser
	? (s: string) => new window.DOMParser().parseFromString(s, "text/xml")
	: typeof window.ActiveXObject != "undefined" && new window.ActiveXObject("Microsoft.XMLDOM")
	? (s: string) => {
				const xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
				xmlDoc.async = "false";
				xmlDoc.loadXML(s);
				return xmlDoc;
	}
	: unreachable("Found no XML parser.");

export function loadXml(fileLoader: FileLoader, url: string): Promise<Document> {
	return loadText(fileLoader, url).then(xmlDocumentFromString);
}

export function loadTextureCached(fileLoader: FileLoader, url: string) {
	return fileLoader.load(url).then(blob => {
		const objectUrl = URL.createObjectURL(blob);
		return loadTexture(objectUrl).finally(() => { URL.revokeObjectURL(objectUrl); });
	});
}

type ResourceType<Url extends string>
	= Url extends `${string}.json` ? object
	: Url extends `${string}.xml` ? Document
	: Url extends `${string}.png` ? TexRegion
	: Url extends `${string}.tmx` ? TiledMap
	: Blob;

export default class Loader {
	private constructor(private readonly fileLoader: FileLoader) {}

	static async create(fileLoader: FileLoader): Promise<Loader> {
		return new Loader(fileLoader);
	}

	load<Url extends string>(url: Url): Promise<ResourceType<Url>>;

	load(url: string): Promise<object | Document | TexRegion | TiledMap | Blob> {
		if (isJsonUrl(url)) return loadJson(this.fileLoader, url);
		else if (isXmlUrl(url)) return loadXml(this.fileLoader, url);
		else if (url.endsWith(".png")) return loadTextureCached(this.fileLoader, url);
		else if (url.endsWith(".tmx")) return TiledMap.load(this.fileLoader, url);
		else return this.fileLoader.load(url);
	}

	/**
	 * Loads a script in the scripts directory.
	 */
	loadScript(path: string) {
		return import("./scripts/" + path).then(module => module.default);
	}

	loadTexturePlaceholder(url: string): TexRegion {
		const region = getPlaceholderTexture();
		this.load(url).then(loadedRegion => {
			Object.assign(region, loadedRegion);
		});
		return region;
	}
}
