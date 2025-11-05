import { SHANGHAI } from "./constants.js";
import { isAtLeast } from "./isAtLeast.js";

/**
 * Check if hardfork has EIP-3855 (PUSH0 opcode)
 *
 * @param {import('./BrandedHardfork.js').BrandedHardfork} fork - Hardfork to check
 * @returns {boolean} true if PUSH0 is available
 *
 * @example
 * ```typescript
 * import { SHANGHAI, MERGE, hasEIP3855 } from './hardfork.js';
 *
 * hasEIP3855(SHANGHAI); // true
 * hasEIP3855(MERGE); // false
 * ```
 */
export function hasEIP3855(fork) {
	return isAtLeast(fork, SHANGHAI);
}
