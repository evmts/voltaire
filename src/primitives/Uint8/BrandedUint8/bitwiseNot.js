import { MAX } from "./constants.js";

/**
 * Bitwise NOT of Uint8 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint8.js').BrandedUint8} uint - Input value
 * @returns {import('./BrandedUint8.js').BrandedUint8} Bitwise NOT result
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const a = Uint8.from(0b11110000);
 * const result = Uint8.bitwiseNot(a); // 0b00001111 = 15
 * ```
 */
export function bitwiseNot(uint) {
	return /** @type {import('./BrandedUint8.js').BrandedUint8} */ ((~uint) & MAX);
}
