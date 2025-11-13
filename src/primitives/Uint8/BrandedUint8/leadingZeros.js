/**
 * Count leading zero bits in Uint8 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint8.js').BrandedUint8} uint - Input value
 * @returns {number} Number of leading zero bits (0-8)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * Uint8.leadingZeros(Uint8.from(0)); // 8
 * Uint8.leadingZeros(Uint8.from(1)); // 7
 * Uint8.leadingZeros(Uint8.from(255)); // 0
 * Uint8.leadingZeros(Uint8.from(128)); // 0
 * ```
 */
export function leadingZeros(uint) {
	if (uint === 0) return 8;
	return Math.clz32(uint) - 24;
}
