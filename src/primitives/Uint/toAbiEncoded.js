import { toBytes } from "./toBytes.js";

/**
 * Convert Uint256 to ABI-encoded bytes (32 bytes, big-endian)
 *
 * This is identical to toBytes() - all Uint256 values in ABI encoding
 * are represented as 32-byte big-endian values.
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./BrandedUint.js').BrandedUint} uint - Uint256 value to encode
 * @returns {Uint8Array} 32-byte ABI-encoded Uint8Array
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const value = Uint256.from(255n);
 * const encoded = Uint256.toAbiEncoded(value);
 * ```
 */
export function toAbiEncoded(uint) {
	return toBytes(uint);
}
