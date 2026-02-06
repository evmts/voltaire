/**
 * Right shift
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./BrandedUint.js').BrandedUint} uint - Value to shift
 * @param {import('./BrandedUint.js').BrandedUint} bits - Number of bits to shift
 * @returns {import('./BrandedUint.js').BrandedUint} uint >> bits
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const a = Uint256.from(256n);
 * const b = Uint256.from(8n);
 * const result = Uint256.shiftRight(a, b); // 1n
 * ```
 */
export function shiftRight(uint, bits) {
	return uint >> bits;
}
