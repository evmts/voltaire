import { fromBytes } from "./fromBytes.js";

/**
 * Create Uint128 from ABI-encoded bytes
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - 32-byte ABI-encoded value
 * @returns {import('./BrandedUint128.js').BrandedUint128} Uint128 value
 * @throws {Error} If bytes length is not 32
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const abiBytes = new Uint8Array(32); // 32 bytes with padding
 * abiBytes[31] = 255;
 * const value = Uint128.fromAbiEncoded(abiBytes);
 * ```
 */
export function fromAbiEncoded(bytes) {
	if (bytes.length !== 32) {
		throw new Error(`ABI-encoded Uint128 must be 32 bytes: ${bytes.length}`);
	}

	// Extract last 16 bytes (big-endian)
	const uint128Bytes = bytes.slice(16, 32);
	return fromBytes(uint128Bytes);
}
