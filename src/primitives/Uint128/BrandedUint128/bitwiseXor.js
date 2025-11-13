/**
 * Bitwise XOR operation
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint128.js').BrandedUint128} uint - First operand
 * @param {import('./BrandedUint128.js').BrandedUint128} b - Second operand
 * @returns {import('./BrandedUint128.js').BrandedUint128} uint ^ b
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(0xffn);
 * const b = Uint128.from(0x0fn);
 * const result = Uint128.bitwiseXor(a, b); // 0xf0
 * ```
 */
export function bitwiseXor(uint, b) {
	return uint ^ b;
}
