import { MERGE } from "./constants.js";
import { isAtLeast } from "./isAtLeast.js";

/**
 * Check if hardfork is post-merge (Proof of Stake)
 *
 * @param {import('./BrandedHardfork.js').BrandedHardfork} fork - Hardfork to check
 * @returns {boolean} true if post-merge
 *
 * @example
 * ```typescript
 * import { SHANGHAI, LONDON, isPostMerge } from './hardfork.js';
 *
 * isPostMerge(SHANGHAI); // true
 * isPostMerge(LONDON); // false
 * ```
 */
export function isPostMerge(fork) {
	return isAtLeast(fork, MERGE);
}
