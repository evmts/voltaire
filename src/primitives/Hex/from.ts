import type { BrandedHex } from "./BrandedHex.js";
import { fromBytes } from "./fromBytes.js";

/**
 * Create Hex from string or bytes
 *
 * @param value - Hex string or bytes
 * @returns Hex string
 *
 * @example
 * ```typescript
 * const hex = Hex.from('0x1234');
 * const hex2 = Hex.from(new Uint8Array([0x12, 0x34]));
 * ```
 */
export function from(value: string | Uint8Array): BrandedHex {
	if (typeof value === "string") {
		return value as BrandedHex;
	}
	return fromBytes(value);
}
