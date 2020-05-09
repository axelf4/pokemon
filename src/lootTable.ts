/**
 * Loot tables for drawing from a weighted set of alternatives.
 *
 * @file
 */

type Weight = number;
type LootTable<T> = readonly (readonly [Weight, T])[]

/**
 * Returns a random item from the loot table.
 *
 * Each entry is a tuple with a weight and item. The weights are arbitrary and
 * do not have to add up to one.
 */
export function choose<T>(table: LootTable<T>) {
	let totalWeight = table.map(x => x[0]).reduce((acc, w) => acc + w, 0);
	let r = Math.random() * totalWeight;
	return table.find(x => (r -= x[0]) < 0)[1];
}
