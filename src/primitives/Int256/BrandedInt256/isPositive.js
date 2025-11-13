/**
 * Check if Int256 is positive
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int256 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt256.js').BrandedInt256} value - Input value
 * @returns {boolean} True if positive
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(42n);
 * Int256.isPositive(a); // true
 * ```
 */
export function isPositive(value) {
	return value > 0n;
}
