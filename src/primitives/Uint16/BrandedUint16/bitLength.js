/**
 * Get bit length of Uint16 value (position of highest set bit)
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint16.js').BrandedUint16} uint - Input value
 * @returns {number} Number of bits needed to represent value (0-16)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * Uint16.bitLength(Uint16.from(0)); // 0
 * Uint16.bitLength(Uint16.from(1)); // 1
 * Uint16.bitLength(Uint16.from(65535)); // 16
 * Uint16.bitLength(Uint16.from(32768)); // 16
 * ```
 */
export function bitLength(uint) {
	if (uint === 0) return 0;
	return 32 - Math.clz32(uint);
}
