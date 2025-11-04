import type { BrandedHex } from "./BrandedHex.js";
import { hexCharToValue } from "./utils.js";

/**
 * Check if string is valid hex
 *
 * @param value - String to validate
 * @returns True if valid hex format
 *
 * @example
 * ```typescript
 * Hex.isHex('0x1234'); // true
 * Hex.isHex('1234');   // false
 * Hex.isHex('0xZZZZ'); // false
 * ```
 */
export function isHex(value: string): value is BrandedHex {
	if (value.length < 3 || !value.startsWith("0x")) return false;
	for (let i = 2; i < value.length; i++) {
		if (hexCharToValue(value[i]) === null) return false;
	}
	return true;
}
