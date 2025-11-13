/**
 * Count leading zeros in Uint64 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint64.js').BrandedUint64} uint - Value
 * @returns {number} Number of leading zero bits
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.from(255n);
 * const result = Uint64.leadingZeros(a); // 56
 * ```
 */
export function leadingZeros(uint) {
	if (uint === 0n) return 64;
	return 64 - uint.toString(2).length;
}
