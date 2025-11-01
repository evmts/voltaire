import type { Type } from "./Uint.js";

/**
 * Convert Uint256 to bytes (big-endian, 32 bytes)
 *
 * @param this - Uint256 value to convert
 * @returns 32-byte Uint8Array
 *
 * @example
 * ```typescript
 * const value = Uint.from(255);
 * const bytes = Uint.toBytes.call(value);
 * ```
 */
export function toBytes(this: Type): Uint8Array {
	const bytes = new Uint8Array(32);
	let val = this as bigint;

	for (let i = 31; i >= 0; i--) {
		bytes[i] = Number(val & 0xffn);
		val = val >> 8n;
	}

	return bytes;
}
