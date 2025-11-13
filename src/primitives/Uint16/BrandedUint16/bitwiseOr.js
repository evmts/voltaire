/**
 * Bitwise OR of two Uint16 values
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint16.js').BrandedUint16} a - First operand
 * @param {import('./BrandedUint16.js').BrandedUint16} b - Second operand
 * @returns {import('./BrandedUint16.js').BrandedUint16} Bitwise OR result
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const a = Uint16.from(0b1111111100000000);
 * const b = Uint16.from(0b0000000011111111);
 * const result = Uint16.bitwiseOr(a, b); // 0b1111111111111111 = 65535
 * ```
 */
export function bitwiseOr(a, b) {
	return /** @type {import('./BrandedUint16.js').BrandedUint16} */ (a | b);
}
