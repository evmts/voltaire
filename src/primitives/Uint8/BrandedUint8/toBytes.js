/**
 * Convert Uint8 to Uint8Array (1 byte)
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint8.js').BrandedUint8} uint - Uint8 value
 * @returns {Uint8Array} Uint8Array of length 1
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const value = Uint8.from(255);
 * const bytes = Uint8.toBytes(value); // Uint8Array([255])
 * ```
 */
export function toBytes(uint) {
	return new Uint8Array([uint]);
}
