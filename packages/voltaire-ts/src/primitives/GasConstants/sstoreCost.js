import { calculateSstoreCost } from "./calculateSstoreCost.js";

/**
 * Calculate SSTORE gas cost (convenience form with this:)
 *
 * @this {{ isWarm: boolean; currentValue: bigint; newValue: bigint }}
 * @returns {{ cost: bigint; refund: bigint }}
 */
export function sstoreCost() {
	return calculateSstoreCost(this.isWarm, this.currentValue, this.newValue);
}
