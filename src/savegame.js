const key = "gameSave";

var supportsLocalStorage = function() {
	try {
		return 'localStorage' in window && window['localStorage'] !== null;
	} catch(e){
		return false;
	}
};
if (!supportsLocalStorage()) {
	alert("Your browser doesn't support Web Storage.");
}

var save = {};

exports.hasSave = function() {
	return window.localStorage.getItem(key) !== null;
};

exports.getSave = function() {
	return save;
};

exports.loadSave = function() {
	save = JSON.parse(window.localStorage.getItem(key));
};

exports.performSave = function() {
	window.localStorage.setItem(key, JSON.stringify(save));
};

exports.clearSave = function() {
	save = {};
};
