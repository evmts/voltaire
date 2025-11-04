import type { Unsized } from "./Hex.js";

/**
 * Convert hex to number
 *
 * @returns Number value
 * @throws {RangeError} If hex represents value larger than MAX_SAFE_INTEGER
 *
 * @example
 * ```typescript
 * const hex: Hex = '0xff';
 * const num = Hex.toNumber.call(hex); // 255
 * ```
 */
export function toNumber(this: Unsized): number {
	const num = Number.parseInt(this.slice(2), 16);
	if (!Number.isSafeInteger(num)) {
		throw new RangeError("Hex value exceeds MAX_SAFE_INTEGER");
	}
	return num;
}
