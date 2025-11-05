import { calculateKeccak256Cost } from "./calculateKeccak256Cost.js";

/**
 * Calculate KECCAK256 gas cost (convenience form with this:)
 *
 * @this {bigint}
 * @returns {bigint} Total gas cost
 */
export function keccak256Cost() {
	return calculateKeccak256Cost(this);
}
