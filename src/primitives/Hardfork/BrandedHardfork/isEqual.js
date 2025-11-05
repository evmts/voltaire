/**
 * Check if two hardforks are equal
 *
 * @param {import('./BrandedHardfork.js').BrandedHardfork} a - First hardfork
 * @param {import('./BrandedHardfork.js').BrandedHardfork} b - Second hardfork
 * @returns {boolean} true if a == b
 *
 * @example
 * ```typescript
 * import { CANCUN, isEqual } from './hardfork.js';
 *
 * if (isEqual(fork, CANCUN)) {
 *   // Exactly Cancun
 * }
 * ```
 */
export function isEqual(a, b) {
	return a === b;
}
