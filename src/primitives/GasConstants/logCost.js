import { calculateLogCost } from "./calculateLogCost.js";

/**
 * Calculate LOG gas cost (convenience form with this:)
 *
 * @this {{ topicCount: bigint; dataSize: bigint }}
 * @returns {bigint}
 */
export function logCost() {
	return calculateLogCost(this.topicCount, this.dataSize);
}
