/**
 * Count leading zeros in Uint32 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint32.js').BrandedUint32} uint - Value
 * @returns {number} Number of leading zero bits
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const a = Uint32.from(255);
 * const result = Uint32.leadingZeros(a); // 24
 * ```
 */
export function leadingZeros(uint) {
	return Math.clz32(uint);
}
