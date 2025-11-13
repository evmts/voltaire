import { MAX } from "./constants.js";

/**
 * Left shift Uint8 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint8.js').BrandedUint8} uint - Value to shift
 * @param {number} shift - Number of bits to shift (0-7)
 * @returns {import('./BrandedUint8.js').BrandedUint8} Left-shifted value (masked to 8 bits)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const a = Uint8.from(0b00001111);
 * const result = Uint8.shiftLeft(a, 4); // 0b11110000 = 240
 * ```
 */
export function shiftLeft(uint, shift) {
	return /** @type {import('./BrandedUint8.js').BrandedUint8} */ (
		(uint << shift) & MAX
	);
}
