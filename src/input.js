/** Dictionary of pressed keys. String->boolean */
export const keys = {};
let listener = null;

export const KEY_ACTION_UP = 0x0, KEY_ACTION_DOWN = 0x1;

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

export function setListener(value) { listener = value; }
