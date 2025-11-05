import { LONDON } from "./constants.js";
import { isAtLeast } from "./isAtLeast.js";

/**
 * Check if hardfork has EIP-1559 (base fee mechanism)
 *
 * @param {import('./BrandedHardfork.js').BrandedHardfork} fork - Hardfork to check
 * @returns {boolean} true if EIP-1559 is active
 *
 * @example
 * ```typescript
 * import { LONDON, BERLIN, hasEIP1559 } from './hardfork.js';
 *
 * hasEIP1559(LONDON); // true
 * hasEIP1559(BERLIN); // false
 * ```
 */
export function hasEIP1559(fork) {
	return isAtLeast(fork, LONDON);
}
