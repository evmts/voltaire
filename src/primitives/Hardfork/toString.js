/**
 * Convert hardfork to string name
 *
 * @param {import('./HardforkType.js').HardforkType} fork - Hardfork
 * @returns {string} Lowercase hardfork name
 *
 * @example
 * ```typescript
 * import { CANCUN, MERGE, toString } from './hardfork.js';
 *
 * toString(CANCUN); // "cancun"
 * toString(MERGE); // "merge"
 * ```
 */
export function toString(fork) {
	return fork;
}
