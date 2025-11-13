/**
 * Convert Int256 to bigint
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int256 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt256.js').BrandedInt256} value - Int256 value
 * @returns {bigint} BigInt value
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(-42n);
 * Int256.toBigInt(a); // -42n
 * ```
 */
export function toBigInt(value) {
	return value;
}
