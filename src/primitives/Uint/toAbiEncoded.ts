import type { Type } from "./Uint.js";
import { toBytes } from "./toBytes.js";

/**
 * Convert Uint256 to ABI-encoded bytes (32 bytes, big-endian)
 *
 * This is identical to toBytes() - all Uint256 values in ABI encoding
 * are represented as 32-byte big-endian values.
 *
 * @param this - Uint256 value to encode
 * @returns 32-byte ABI-encoded Uint8Array
 *
 * @example
 * ```typescript
 * const value = Uint.from(255);
 * const encoded = Uint.toAbiEncoded.call(value);
 * ```
 */
export function toAbiEncoded(this: Type): Uint8Array {
	return toBytes.call(this);
}
