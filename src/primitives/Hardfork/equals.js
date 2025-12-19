/**
 * Check if two hardforks are equal
 *
 * @param {import('./HardforkType.ts').HardforkType} a - First hardfork
 * @param {import('./HardforkType.ts').HardforkType} b - Second hardfork
 * @returns {boolean} true if a == b
 *
 * @example
 * ```typescript
 * import { CANCUN, equals } from './hardfork.js';
 *
 * if (equals(fork, CANCUN)) {
 *   // Exactly Cancun
 * }
 * ```
 */
export function equals(a, b) {
	return a === b;
}
