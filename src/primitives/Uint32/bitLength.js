/**
 * Calculate bit length of Uint32 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint32.js').BrandedUint32} uint - Value
 * @returns {number} Number of bits needed to represent value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const a = Uint32.from(255);
 * const result = Uint32.bitLength(a); // 8
 * ```
 */
export function bitLength(uint) {
	if (uint === 0) return 0;
	return 32 - Math.clz32(uint);
}
