/** Dictionary of pressed keys. */
export const keys: {[key: string]: boolean} = {};

type Listener = (type: KeyAction, key: string) => void;
let listener: Listener | null = null;

export enum KeyAction {
	Up,
	Down,
}

window.addEventListener('keydown', function(event) {
	if (!event.repeat) {
		keys[event.key] = true;
		if (listener) listener(KeyAction.Down, event.key);
	}
}, false);

window.addEventListener('keyup', function(event) {
	keys[event.key] = false;
	if (listener) listener(KeyAction.Up, event.key);
}, false);

export function setListener(value: Listener) { listener = value; }
