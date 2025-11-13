import type { BrandedUint256 } from "./BrandedUint256.js";

/**
 * Convert Uint256 to bytes (big-endian, 32 bytes)
 *
 * @param uint - Uint256 value to convert
 * @returns 32-byte Uint8Array
 *
 * @example
 * ```typescript
 * const value = Uint(255n);
 * const bytes1 = Uint.toBytes(value);
 * const bytes2 = value.toBytes();
 * ```
 */
export function toBytes(uint: BrandedUint256): Uint8Array {
	const bytes = new Uint8Array(32);
	let val = uint as bigint;

	for (let i = 31; i >= 0; i--) {
		bytes[i] = Number(val & 0xffn);
		val = val >> 8n;
	}

	return bytes;
}
