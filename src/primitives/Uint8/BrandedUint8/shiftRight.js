/**
 * Right shift Uint8 value (logical shift)
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint8.js').BrandedUint8} uint - Value to shift
 * @param {number} shift - Number of bits to shift (0-7)
 * @returns {import('./BrandedUint8.js').BrandedUint8} Right-shifted value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const a = Uint8.from(0b11110000);
 * const result = Uint8.shiftRight(a, 4); // 0b00001111 = 15
 * ```
 */
export function shiftRight(uint, shift) {
	return /** @type {import('./BrandedUint8.js').BrandedUint8} */ (uint >>> shift);
}
