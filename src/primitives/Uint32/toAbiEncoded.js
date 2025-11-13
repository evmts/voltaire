/**
 * Convert Uint32 to ABI-encoded bytes (32 bytes, big-endian, left-padded with zeros)
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint32.js').BrandedUint32} uint - Uint32 value to convert
 * @returns {Uint8Array} 32-byte Uint8Array
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const value = Uint32.from(255);
 * const abiBytes = Uint32.toAbiEncoded(value); // 32 bytes with last byte = 255
 * ```
 */
export function toAbiEncoded(uint) {
	const bytes = new Uint8Array(32);

	for (let i = 31; i >= 28; i--) {
		bytes[i] = uint & 0xff;
		uint = uint >>> 8;
	}

	return bytes;
}
