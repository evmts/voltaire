import type { Unsized } from "./Hex.js";

/**
 * Get byte size of hex
 *
 * @returns Size in bytes
 *
 * @example
 * ```typescript
 * const hex: Hex = '0x1234';
 * const s = Hex.size.call(hex); // 2
 * ```
 */
export function size(this: Unsized): number {
	return (this.length - 2) / 2;
}
