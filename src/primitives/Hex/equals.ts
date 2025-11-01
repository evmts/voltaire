import type { Unsized } from "./Hex.js";

/**
 * Check if two hex strings are equal
 *
 * @param other - Hex string to compare with
 * @returns True if equal
 *
 * @example
 * ```typescript
 * const hex1: Hex = '0x1234';
 * Hex.equals.call(hex1, '0x1234'); // true
 * ```
 */
export function equals(this: Unsized, other: Unsized): boolean {
	return this.toLowerCase() === other.toLowerCase();
}
