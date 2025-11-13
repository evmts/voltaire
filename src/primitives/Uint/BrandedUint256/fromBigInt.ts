import type { BrandedUint256 } from "./BrandedUint256.js";
import { MAX } from "./constants.js";

/**
 * Create Uint256 from bigint
 *
 * @param value - bigint to convert
 * @returns Uint256 value
 * @throws Error if value out of range
 *
 * @example
 * ```typescript
 * const value = Uint.fromBigInt(100n);
 * ```
 */
export function fromBigInt(value: bigint): BrandedUint256 {
	if (value < 0n) {
		throw new Error(`Uint256 value cannot be negative: ${value}`);
	}

	if (value > MAX) {
		throw new Error(`Uint256 value exceeds maximum: ${value}`);
	}

	return value as BrandedUint256;
}
