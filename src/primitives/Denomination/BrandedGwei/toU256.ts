import type { BrandedUint } from "../../Uint/BrandedUint/BrandedUint.js";
import type { BrandedGwei } from "./BrandedGwei.js";

/**
 * Convert Gwei to base Uint256 type
 *
 * @param gwei - Amount in Gwei
 * @returns Uint256 value (type cast, no conversion)
 *
 * @example
 * ```typescript
 * const gwei = Gwei.from(1000000000n);
 * const u256 = Gwei.toU256(gwei);
 * // u256 = 1000000000n (as Uint256)
 * ```
 */
export function toU256(gwei: BrandedGwei): BrandedUint {
	return gwei as BrandedUint;
}
