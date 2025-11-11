/**
 * Bitwise XOR operation
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./BrandedUint.js').BrandedUint} uint - First operand
 * @param {import('./BrandedUint.js').BrandedUint} b - Second operand
 * @returns {import('./BrandedUint.js').BrandedUint} uint ^ b
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const a = Uint256.from(0xffn);
 * const b = Uint256.from(0x0fn);
 * const result = Uint256.bitwiseXor(a, b); // 0xf0
 * ```
 */
export function bitwiseXor(uint, b) {
	return uint ^ b;
}
