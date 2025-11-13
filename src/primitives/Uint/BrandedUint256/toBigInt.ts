import type { BrandedUint256 } from "./BrandedUint256.js";

/**
 * Convert Uint256 to bigint
 *
 * @param uint - Uint256 value to convert
 * @returns bigint value
 *
 * @example
 * ```typescript
 * const value = Uint(255n);
 * const bigint1 = Uint.toBigInt(value);
 * const bigint2 = value.toBigInt();
 * ```
 */
export function toBigInt(uint: BrandedUint256): bigint {
	return uint as bigint;
}
