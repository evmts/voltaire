import type { BrandedUint256 } from "./BrandedUint256.js";
import { toBytes } from "./toBytes.js";

/**
 * Convert Uint256 to ABI-encoded bytes (32 bytes, big-endian)
 *
 * This is identical to toBytes() - all Uint256 values in ABI encoding
 * are represented as 32-byte big-endian values.
 *
 * @param uint - Uint256 value to encode
 * @returns 32-byte ABI-encoded Uint8Array
 *
 * @example
 * ```typescript
 * const value = Uint(255n);
 * const encoded1 = Uint.toAbiEncoded(value);
 * const encoded2 = value.toAbiEncoded();
 * ```
 */
export function toAbiEncoded(uint: BrandedUint256): Uint8Array {
	return toBytes(uint);
}
