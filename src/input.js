var keys = {}; // String->Boolean dictionary of pressed keys
var listener = null;

var KEY_ACTION_UP = exports.KEY_ACTION_UP = 0x0;
var KEY_ACTION_DOWN = exports.KEY_ACTION_DOWN = 0x1;

window.addEventListener('keydown', function(event) {
	if (!event.repeat) {
		keys[event.key] = true;
		if (listener !== null) listener(KEY_ACTION_DOWN, event.key);
	}
}, false);

window.addEventListener('keyup', function(event) {
	keys[event.key] = false;
	if (listener !== null) listener(KEY_ACTION_UP, event.key);
}, false);

exports.setListener = function(value) {
	listener = value;
};

exports.keys = keys;
