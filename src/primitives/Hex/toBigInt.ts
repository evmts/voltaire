import type { Unsized } from "./Hex.js";

/**
 * Convert hex to bigint
 *
 * @returns BigInt value
 *
 * @example
 * ```typescript
 * const hex: Hex = '0xff';
 * const big = Hex.toBigInt.call(hex); // 255n
 * ```
 */
export function toBigInt(this: Unsized): bigint {
	return BigInt(this);
}
