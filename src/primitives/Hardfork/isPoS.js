import { isPostMerge } from "./isPostMerge.js";

/**
 * Check if hardfork is post-merge (convenience form)
 *
 * @param {import('./HardforkType.ts').HardforkType} fork - Hardfork to check
 * @returns {boolean} true if post-merge
 *
 * @example
 * ```typescript
 * import { SHANGHAI, isPoS } from './hardfork.js';
 *
 * isPoS(SHANGHAI); // true
 * ```
 */
export function isPoS(fork) {
	return isPostMerge(fork);
}
