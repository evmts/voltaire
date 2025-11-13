/**
 * Create Uint32 from ABI-encoded bytes (32 bytes, big-endian, left-padded)
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - ABI-encoded byte array (32 bytes)
 * @returns {import('./BrandedUint32.js').BrandedUint32} Uint32 value
 * @throws {Error} If bytes length is not 32
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const abiBytes = new Uint8Array(32);
 * abiBytes[31] = 255;
 * const value = Uint32.fromAbiEncoded(abiBytes); // 255
 * ```
 */
export function fromAbiEncoded(bytes) {
	if (bytes.length !== 32) {
		throw new Error(`Uint32 ABI-encoded bytes must be 32 bytes, got ${bytes.length}`);
	}

	let value = 0;
	for (let i = 28; i < 32; i++) {
		value = (value << 8) | bytes[i];
	}

	return value >>> 0;
}
