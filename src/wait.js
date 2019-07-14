/**
 * Promise version of <code>setTimeout</code>.
 *
 * @param delay The delay in milliseconds.
 * @return A promise that resolves after the specified amount of time.
 */
export default function(delay, ...args) {
	return new Promise(resolve => setTimeout(resolve.bind(globalThis, ...args), delay));
}
