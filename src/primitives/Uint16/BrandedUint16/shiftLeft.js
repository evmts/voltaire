import { MAX } from "./constants.js";

/**
 * Left shift Uint16 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint16.js').BrandedUint16} uint - Value to shift
 * @param {number} shift - Number of bits to shift (0-15)
 * @returns {import('./BrandedUint16.js').BrandedUint16} Left-shifted value (masked to 16 bits)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const a = Uint16.from(0b0000000011111111);
 * const result = Uint16.shiftLeft(a, 8); // 0b1111111100000000 = 65280
 * ```
 */
export function shiftLeft(uint, shift) {
	return /** @type {import('./BrandedUint16.js').BrandedUint16} */ ((uint << shift) & MAX);
}
