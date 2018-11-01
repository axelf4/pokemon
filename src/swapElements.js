/**
 * Swap two elements of an array.
 * @param array The array.
 * @param a The index of the first element.
 * @param b The index of the second element.
 *
 * If a equals b then an error is thrown.
 */
export default function swapElements(array, a, b) {
	if (a === b) throw new Error("Cannot swap the same element");
	array[a] = array.splice(b, 1, array[a])[0];
}
