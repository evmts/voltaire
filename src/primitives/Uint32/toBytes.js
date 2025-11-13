import { SIZE } from "./constants.js";

/**
 * Convert Uint32 to bytes (big-endian, 4 bytes)
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint32.js').BrandedUint32} uint - Uint32 value to convert
 * @returns {Uint8Array} 4-byte Uint8Array
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const value = Uint32.from(255);
 * const bytes = Uint32.toBytes(value); // Uint8Array([0, 0, 0, 255])
 * ```
 */
export function toBytes(uint) {
	const bytes = new Uint8Array(SIZE);

	for (let i = SIZE - 1; i >= 0; i--) {
		bytes[i] = uint & 0xff;
		uint = uint >>> 8;
	}

	return bytes;
}
