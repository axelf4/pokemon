var keys = []; // Array of keys down
var pressedKeys = []; // Array of keys pressed this frame
window.addEventListener('keydown', function(e) {
	keys[e.keyCode] = true;
	pressedKeys.push(e.keyCode);
}, false);
window.addEventListener('keyup', function(e) {
	keys[e.keyCode] = false;
}, false);

module.exports.keys = keys;
module.exports.pressedKeys = pressedKeys;
