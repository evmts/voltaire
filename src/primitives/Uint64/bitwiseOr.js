/**
 * Bitwise OR Uint64 values
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint64.js').BrandedUint64} uint - First operand
 * @param {import('./BrandedUint64.js').BrandedUint64} b - Second operand
 * @returns {import('./BrandedUint64.js').BrandedUint64} Result (uint | b)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.from(0b1100n);
 * const b = Uint64.from(0b1010n);
 * const result = Uint64.bitwiseOr(a, b); // 0b1110n = 14n
 * ```
 */
export function bitwiseOr(uint, b) {
	return uint | b;
}
