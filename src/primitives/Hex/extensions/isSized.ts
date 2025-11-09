import type { Hex } from "ox";
import * as OxHex from "ox/Hex";

/**
 * Check if hex value has a specific size
 * Voltaire extension - not available in Ox
 *
 * @param value - Hex value to check
 * @param size - Expected size in bytes
 * @returns True if hex value has the specified size
 *
 * @example
 * isSized('0x1234', 2) // true
 * isSized('0x1234', 4) // false
 */
export function isSized(value: Hex.Hex, size: number): boolean {
	return OxHex.size(value) === size;
}
