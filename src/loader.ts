import FileLoader from "./FileLoader";
import { loadTexture, TexRegion, whiteTexRegion } from "./texture";
import TiledMap from "./TiledMap";
import { mapObject, unreachable } from "./utils";

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

export function loadTextureCached(fileLoader: FileLoader, url: string): Promise<TexRegion> {
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

interface Frame {
	x: number;
	y: number;
	w: number;
	h: number;

	imageSrc: string;
}

class AtlasLoader {
	private constructor(
		private readonly fileLoader: FileLoader,
		private readonly frames: {[url: string]: Frame},
	) {}

	static async create(fileLoader: FileLoader): Promise<AtlasLoader> {
		let atlases = [
			await loadJson(fileLoader, "atlases/atlas.json")
		];
		// Probe for all numbered atlases
		for (let i = 0; ; ++i) {
			try {
				atlases.push(await loadJson(fileLoader, `atlases/atlas-${i}.json`));
			} catch {
				break;
			}
		}

		let frames = atlases
			.flatMap((atlas: any) => mapObject(atlas.frames, ((frame: any) => Object.assign(
				{
					imageSrc: atlas.meta.image,
				},
				frame.frame
			))))
			.reduce(Object.assign);

		return new AtlasLoader(fileLoader, frames);
	}

	load(url: string): Promise<TexRegion> | undefined {
		let frame = this.frames[`assets/sprites/${url}`];
		if (!frame) return undefined;
		let {x, y, w, h, imageSrc} = frame;

		return loadTextureCached(this.fileLoader, `atlases/${imageSrc}`)
			.then(({texture}) => new TexRegion(texture, x, y, x + w, y + h));
	}
}

export default class Loader {
	private constructor(
		private readonly fileLoader: FileLoader,
		private readonly atlasLoader: AtlasLoader,
	) {}

	static async create(fileLoader: FileLoader): Promise<Loader> {
		let atlasLoader = await AtlasLoader.create(fileLoader);
		return new Loader(fileLoader, atlasLoader);
	}

	load<Url extends string>(url: Url): Promise<ResourceType<Url>>;

	load(url: string): Promise<object | Document | TexRegion | TiledMap | Blob> {
		if (isJsonUrl(url)) return loadJson(this.fileLoader, url);
		else if (isXmlUrl(url)) return loadXml(this.fileLoader, url);
		else if (url.endsWith(".png"))
			return this.atlasLoader.load(url) ?? loadTextureCached(this.fileLoader, url);
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
		// Create a new TexRegion that eventually gets its texture overwritten
		const texRegion = Object.create(whiteTexRegion);
		this.load(url).then(loadedRegion => {
			Object.assign(texRegion, loadedRegion);
		});
		return texRegion;
	}
}
