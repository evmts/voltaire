import { CANCUN } from "../Hardfork/constants.js";
import { isHardforkAtLeast } from "./isHardforkAtLeast.js";

/**
 * Check if a hardfork includes EIP-4844 (blob transactions)
 *
 * True for Cancun and every later fork.
 *
 * @param {import('./types.js').Hardfork} hardfork - EVM hardfork
 * @returns {boolean} Whether hardfork includes EIP-4844
 * @throws {import('../errors/ValidationError.js').InvalidRangeError} If hardfork is unknown
 */
export function hasEIP4844(hardfork) {
	return isHardforkAtLeast(hardfork, CANCUN);
}
