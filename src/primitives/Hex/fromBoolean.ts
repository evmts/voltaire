import type { Sized } from "./BrandedHex.js";

/**
 * Convert boolean to hex
 *
 * @param value - Boolean to convert
 * @returns Hex string ('0x01' for true, '0x00' for false)
 *
 * @example
 * ```typescript
 * Hex.fromBoolean(true);  // '0x01'
 * Hex.fromBoolean(false); // '0x00'
 * ```
 */
export function fromBoolean(value: boolean): Sized<1> {
	return (value ? "0x01" : "0x00") as Sized<1>;
}
