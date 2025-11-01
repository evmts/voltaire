import type { Unsized, Sized } from "./Hex.js";

/**
 * Check if hex has specific byte size
 *
 * @example
 * ```typescript
 * const hex: Hex = '0x1234';
 * Hex.isSized.call(hex, 2); // true
 * ```
 */
export function isSized<TSize extends number>(
	this: Unsized,
	size: TSize,
): this is Sized<TSize> {
	return (this.length - 2) / 2 === size;
}
