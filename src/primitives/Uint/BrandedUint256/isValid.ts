import type { BrandedUint256 } from "./BrandedUint256.js";
import { MAX } from "./constants.js";

/**
 * Check if value is a valid Uint256
 *
 * @param value - Value to check
 * @returns true if value is valid Uint256
 *
 * @example
 * ```typescript
 * const isValid = Uint.isValid(100n); // true
 * const isInvalid = Uint.isValid(-1n); // false
 * ```
 */
export function isValid(value: unknown): value is BrandedUint256 {
	if (typeof value !== "bigint") return false;
	return value >= 0n && value <= (MAX as bigint);
}
