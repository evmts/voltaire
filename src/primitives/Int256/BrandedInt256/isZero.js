/**
 * Check if Int256 is zero
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int256 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt256.js').BrandedInt256} value - Input value
 * @returns {boolean} True if zero
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(0n);
 * Int256.isZero(a); // true
 * ```
 */
export function isZero(value) {
	return value === 0n;
}
