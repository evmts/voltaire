/**
 * Get number of bits required to represent value
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./BrandedUint.js').BrandedUint} uint - Value to check
 * @returns {number} Number of bits (0-256)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const a = Uint256.from(255n);
 * const bits = Uint256.bitLength(a); // 8
 * ```
 */
export function bitLength(uint) {
	if (uint === 0n) return 0;
	return uint.toString(2).length;
}
