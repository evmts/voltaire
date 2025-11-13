/**
 * Check if Int128 is positive
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt128.js').BrandedInt128} value - Input value
 * @returns {boolean} True if positive
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(42n);
 * Int128.isPositive(a); // true
 * ```
 */
export function isPositive(value) {
	return value > 0n;
}
