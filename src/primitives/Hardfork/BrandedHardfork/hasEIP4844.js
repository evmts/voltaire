import { CANCUN } from "./constants.js";
import { isAtLeast } from "./isAtLeast.js";

/**
 * Check if hardfork has EIP-4844 (blob transactions)
 *
 * @param {import('./BrandedHardfork.js').BrandedHardfork} fork - Hardfork to check
 * @returns {boolean} true if blob transactions are available
 *
 * @example
 * ```typescript
 * import { CANCUN, SHANGHAI, hasEIP4844 } from './hardfork.js';
 *
 * hasEIP4844(CANCUN); // true
 * hasEIP4844(SHANGHAI); // false
 * ```
 */
export function hasEIP4844(fork) {
	return isAtLeast(fork, CANCUN);
}
