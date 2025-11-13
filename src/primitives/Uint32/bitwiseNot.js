/**
 * Bitwise NOT Uint32 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint32.js').BrandedUint32} uint - Operand
 * @returns {import('./BrandedUint32.js').BrandedUint32} Result (~uint)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const a = Uint32.from(0);
 * const result = Uint32.bitwiseNot(a); // 4294967295 (all bits set)
 * ```
 */
export function bitwiseNot(uint) {
	return ~uint >>> 0;
}
