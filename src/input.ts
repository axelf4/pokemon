/** Dictionary of pressed keys. */
export const keys: {[key: string]: boolean} = {};

export enum KeyAction {
	Up,
	Down,
}

type Listener = (type: KeyAction, key: string) => void;
let listener: Listener | null = null;

window.addEventListener('keydown', function(event) {
	if (event.repeat) return;

	keys[event.key] = true;
	listener?.(KeyAction.Down, event.key);
}, false);

window.addEventListener('keyup', function(event) {
	keys[event.key] = false;
	listener?.(KeyAction.Up, event.key);
}, false);

export function setListener(value: Listener) { listener = value; }
