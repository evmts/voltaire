import { isPostMerge } from "./isPostMerge.js";

/**
 * Check if hardfork is post-merge (convenience form)
 *
 * @this {import('./BrandedHardfork.js').BrandedHardfork}
 * @returns {boolean} true if post-merge
 *
 * @example
 * ```typescript
 * import { SHANGHAI, isPoS } from './hardfork.js';
 *
 * isPoS.call(SHANGHAI); // true
 * ```
 */
export function isPoS() {
	return isPostMerge(this);
}
