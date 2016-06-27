var keys = []; // Array of keys down
var listener = null;

var KEY_ACTION_UP = exports.KEY_ACTION_UP = 0x0;
var KEY_ACTION_DOWN = exports.KEY_ACTION_DOWN = 0x1;

window.addEventListener('keydown', function(e) {
	keys[e.keyCode] = true;
	if (listener !== null) listener(KEY_ACTION_DOWN, e.keyCode);
}, false);

window.addEventListener('keyup', function(e) {
	keys[e.keyCode] = false;
	if (listener !== null) listener(KEY_ACTION_UP, e.keyCode);
}, false);

exports.setListener = function(value) {
	listener = value;
};

exports.keys = keys;
