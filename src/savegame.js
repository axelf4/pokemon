const key = "gameSave";

const supportsLocalStorage = function() {
	try {
		return 'localStorage' in window && window['localStorage'] !== null;
	} catch(e){
		return false;
	}
};
if (!supportsLocalStorage()) {
	alert("Your browser doesn't support Web Storage.");
}

export const save = {};
export default save;

export function clearSave() {
	Object.keys(save).forEach(k => delete save[k]);

	save.hasGottenPokemon = true; // should be false
};
clearSave(); // Set defaults

export function hasSave() {
	return window.localStorage.getItem(key) !== null;
};

export function loadSave() {
	const loaded = JSON.parse(window.localStorage.getItem(key));
	clearSave();
	for (let k of loaded) save[k] = loaded[k];
};

export function performSave() {
	window.localStorage.setItem(key, JSON.stringify(save));
};
