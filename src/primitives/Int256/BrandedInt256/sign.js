/**
 * Get sign of Int256 value
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int256 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt256.js').BrandedInt256} value - Input value
 * @returns {-1 | 0 | 1} -1 for negative, 0 for zero, 1 for positive
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(-42n);
 * Int256.sign(a); // -1
 * const b = Int256.from(0n);
 * Int256.sign(b); // 0
 * const c = Int256.from(42n);
 * Int256.sign(c); // 1
 * ```
 */
export function sign(value) {
	if (value < 0n) return -1;
	if (value > 0n) return 1;
	return 0;
}
