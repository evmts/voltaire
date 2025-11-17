import { calculateMemoryExpansionCost } from "./calculateMemoryExpansionCost.js";

/**
 * Calculate memory expansion cost (convenience form with this:)
 *
 * @this {{ oldSize: bigint; newSize: bigint }}
 * @returns {{ oldCost: bigint; newCost: bigint; expansionCost: bigint; words: bigint }}
 */
export function memoryExpansionCost() {
	return calculateMemoryExpansionCost(this.oldSize, this.newSize);
}
