import type { Unsized } from "./Hex.js";

/**
 * Convert number to hex
 *
 * @param value - Number to convert
 * @param size - Optional byte size for padding
 * @returns Hex string
 *
 * @example
 * ```typescript
 * Hex.fromNumber(255);     // '0xff'
 * Hex.fromNumber(255, 2);  // '0x00ff'
 * Hex.fromNumber(0x1234);  // '0x1234'
 * ```
 */
export function fromNumber(value: number, size?: number): Unsized {
	let hex = value.toString(16);
	if (size !== undefined) {
		hex = hex.padStart(size * 2, "0");
	}
	return `0x${hex}` as Unsized;
}
