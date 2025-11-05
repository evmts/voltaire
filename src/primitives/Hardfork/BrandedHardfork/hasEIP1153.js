import { CANCUN } from "./constants.js";
import { isAtLeast } from "./isAtLeast.js";

/**
 * Check if hardfork has EIP-1153 (transient storage)
 *
 * @param {import('./BrandedHardfork.js').BrandedHardfork} fork - Hardfork to check
 * @returns {boolean} true if TLOAD/TSTORE are available
 *
 * @example
 * ```typescript
 * import { CANCUN, SHANGHAI, hasEIP1153 } from './hardfork.js';
 *
 * hasEIP1153(CANCUN); // true
 * hasEIP1153(SHANGHAI); // false
 * ```
 */
export function hasEIP1153(fork) {
	return isAtLeast(fork, CANCUN);
}
