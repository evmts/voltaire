/**
 * Multiply Uint32 value with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint32.js').BrandedUint32} uint - First operand
 * @param {import('./BrandedUint32.js').BrandedUint32} b - Second operand
 * @returns {import('./BrandedUint32.js').BrandedUint32} Product (uint * b) mod 2^32
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const a = Uint32.from(100);
 * const b = Uint32.from(50);
 * const product = Uint32.times(a, b); // 5000
 * ```
 */
export function times(uint, b) {
	return Math.imul(uint, b) >>> 0;
}
