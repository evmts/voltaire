/**
 * Convert Uint16 to Uint8Array (2 bytes, big-endian)
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint16.js').BrandedUint16} uint - Uint16 value
 * @returns {Uint8Array} Uint8Array of length 2
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const value = Uint16.from(65535);
 * const bytes = Uint16.toBytes(value); // Uint8Array([255, 255])
 * ```
 */
export function toBytes(uint) {
	return new Uint8Array([(uint >> 8) & 0xff, uint & 0xff]);
}
