/**
 * Right shift Uint32 value (logical shift, zero-fill)
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint32.js').BrandedUint32} uint - Value to shift
 * @param {number} bits - Number of bits to shift (0-31)
 * @returns {import('./BrandedUint32.js').BrandedUint32} Result (uint >>> bits)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const a = Uint32.from(256);
 * const result = Uint32.shiftRight(a, 8); // 1
 * ```
 */
export function shiftRight(uint, bits) {
	return uint >>> bits;
}
