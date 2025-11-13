import { MAX } from "./constants.js";

/**
 * Bitwise NOT of Uint16 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint16.js').BrandedUint16} uint - Input value
 * @returns {import('./BrandedUint16.js').BrandedUint16} Bitwise NOT result
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const a = Uint16.from(0b1111111100000000);
 * const result = Uint16.bitwiseNot(a); // 0b0000000011111111 = 255
 * ```
 */
export function bitwiseNot(uint) {
	return /** @type {import('./BrandedUint16.js').BrandedUint16} */ (
		~uint & MAX
	);
}
