import { calculateCopyCost } from "./calculateCopyCost.js";

/**
 * Calculate copy operation gas cost (convenience form with this:)
 *
 * @this {bigint}
 * @returns {bigint}
 */
export function copyCost() {
	return calculateCopyCost(this);
}
