import { LONDON } from "../Hardfork/constants.js";
import { isHardforkAtLeast } from "./isHardforkAtLeast.js";

/**
 * Check if a hardfork includes EIP-3529 (reduced refunds)
 *
 * True for London and every later fork.
 *
 * @param {import('./types.js').Hardfork} hardfork - EVM hardfork
 * @returns {boolean} Whether hardfork includes EIP-3529
 * @throws {import('../errors/ValidationError.js').InvalidRangeError} If hardfork is unknown
 */
export function hasEIP3529(hardfork) {
	return isHardforkAtLeast(hardfork, LONDON);
}
