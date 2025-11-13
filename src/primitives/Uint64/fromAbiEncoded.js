/**
 * Create Uint64 from ABI-encoded bytes (32 bytes, big-endian, left-padded)
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - ABI-encoded byte array (32 bytes)
 * @returns {import('./BrandedUint64.js').BrandedUint64} Uint64 value
 * @throws {Error} If bytes length is not 32
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const abiBytes = new Uint8Array(32);
 * abiBytes[31] = 255;
 * const value = Uint64.fromAbiEncoded(abiBytes); // 255n
 * ```
 */
export function fromAbiEncoded(bytes) {
	if (bytes.length !== 32) {
		throw new Error(`Uint64 ABI-encoded bytes must be 32 bytes, got ${bytes.length}`);
	}

	let value = 0n;
	for (let i = 24; i < 32; i++) {
		value = (value << 8n) | BigInt(bytes[i]);
	}

	return value;
}
