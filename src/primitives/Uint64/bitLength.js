/**
 * Calculate bit length of Uint64 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint64.js').BrandedUint64} uint - Value
 * @returns {number} Number of bits needed to represent value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.from(255n);
 * const result = Uint64.bitLength(a); // 8
 * ```
 */
export function bitLength(uint) {
	if (uint === 0n) return 0;
	return uint.toString(2).length;
}
