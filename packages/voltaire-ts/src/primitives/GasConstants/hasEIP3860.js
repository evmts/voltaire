import { SHANGHAI } from "../Hardfork/constants.js";
import { isHardforkAtLeast } from "./isHardforkAtLeast.js";

/**
 * Check if a hardfork includes EIP-3860 (initcode size limit)
 *
 * True for Shanghai and every later fork.
 *
 * @param {import('./types.js').Hardfork} hardfork - EVM hardfork
 * @returns {boolean} Whether hardfork includes EIP-3860
 * @throws {import('../errors/ValidationError.js').InvalidRangeError} If hardfork is unknown
 */
export function hasEIP3860(hardfork) {
	return isHardforkAtLeast(hardfork, SHANGHAI);
}
