import { BERLIN } from "../Hardfork/constants.js";
import { isHardforkAtLeast } from "./isHardforkAtLeast.js";

/**
 * Check if a hardfork includes EIP-2929 (cold/warm access costs)
 *
 * True for Berlin and every later fork.
 *
 * @param {import('./types.js').Hardfork} hardfork - EVM hardfork
 * @returns {boolean} Whether hardfork includes EIP-2929
 * @throws {import('../errors/ValidationError.js').InvalidRangeError} If hardfork is unknown
 */
export function hasEIP2929(hardfork) {
	return isHardforkAtLeast(hardfork, BERLIN);
}
