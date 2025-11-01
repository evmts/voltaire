import type { Type } from "./Uint.js";
import { fromBytes } from "./fromBytes.js";

/**
 * Decode Uint256 from ABI-encoded bytes (32 bytes, big-endian)
 *
 * @param bytes - 32-byte ABI-encoded data
 * @returns Decoded Uint256 value
 * @throws Error if bytes length is not 32
 *
 * @example
 * ```typescript
 * const encoded = new Uint8Array(32);
 * encoded[31] = 255;
 * const value = Uint.fromAbiEncoded(encoded); // 255n
 * ```
 */
export function fromAbiEncoded(bytes: Uint8Array): Type {
	if (bytes.length !== 32) {
		throw new Error(`ABI-encoded Uint256 must be exactly 32 bytes, got ${bytes.length}`);
	}
	return fromBytes.call(bytes);
}
