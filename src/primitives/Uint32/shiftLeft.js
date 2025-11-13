/**
 * Left shift Uint32 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint32.js').BrandedUint32} uint - Value to shift
 * @param {number} bits - Number of bits to shift (0-31)
 * @returns {import('./BrandedUint32.js').BrandedUint32} Result (uint << bits) mod 2^32
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const a = Uint32.from(1);
 * const result = Uint32.shiftLeft(a, 8); // 256
 * ```
 */
export function shiftLeft(uint, bits) {
	return (uint << bits) >>> 0;
}
