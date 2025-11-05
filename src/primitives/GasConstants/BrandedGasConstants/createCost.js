import { calculateCreateCost } from "./calculateCreateCost.js";

/**
 * Calculate contract creation gas cost (convenience form with this:)
 *
 * @this {{ initcodeSize: bigint; deployedSize: bigint }}
 * @returns {{ base: bigint; dynamic: bigint; total: bigint }}
 */
export function createCost() {
	return calculateCreateCost(this.initcodeSize, this.deployedSize);
}
