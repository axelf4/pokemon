var keys = []; // Array of keys down
var pressedKeys = []; // Array of keys pressed this frame
var inputListener = null;

var KEY_ACTION_UP = exports.KEY_ACTION_UP = 0x0;
var KEY_ACTION_DOWN = exports.KEY_ACTION_DOWN = 0x1;

window.addEventListener('keydown', function(e) {
	keys[e.keyCode] = true;
	if (inputListener !== null) inputListener.onKey(KEY_ACTION_UP, e.keyCode);
	pressedKeys.push(e.keyCode);
}, false);

window.addEventListener('keyup', function(e) {
	keys[e.keyCode] = false;
	if (inputListener !== null) inputListener.onKey(KEY_ACTION_DOWN, e.keyCode);
}, false);

/**
 * @deprecated
 */
exports.keyPressed = function(key) {
	return pressedKeys.indexOf(key) !== -1;
};

exports.setInputListener = function(listener) {
	inputListener = listener;
};

module.exports.keys = keys;
module.exports.pressedKeys = pressedKeys;
