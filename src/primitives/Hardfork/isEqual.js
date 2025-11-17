/**
 * Check if two hardforks are equal
 *
 * @param {import('./HardforkType.ts').HardforkType} a - First hardfork
 * @param {import('./HardforkType.ts').HardforkType} b - Second hardfork
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
