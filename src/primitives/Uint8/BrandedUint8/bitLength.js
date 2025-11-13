/**
 * Get bit length of Uint8 value (position of highest set bit)
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint8.js').BrandedUint8} uint - Input value
 * @returns {number} Number of bits needed to represent value (0-8)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * Uint8.bitLength(Uint8.from(0)); // 0
 * Uint8.bitLength(Uint8.from(1)); // 1
 * Uint8.bitLength(Uint8.from(255)); // 8
 * Uint8.bitLength(Uint8.from(128)); // 8
 * ```
 */
export function bitLength(uint) {
	if (uint === 0) return 0;
	return 8 - Math.clz32(uint) - 24;
}
