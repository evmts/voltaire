/**
 * Check if hardfork is post-merge (Proof of Stake)
 *
 * @param {import('./HardforkType.js').HardforkType} fork - Hardfork to check
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
export function isPostMerge(fork: import("./HardforkType.js").HardforkType): boolean;
//# sourceMappingURL=isPostMerge.d.ts.map