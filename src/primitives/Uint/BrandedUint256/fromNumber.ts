import type { BrandedUint256 } from "./BrandedUint256.js";
import { from } from "./from.js";

/**
 * Create Uint256 from number
 *
 * @param value - number to convert
 * @returns Uint256 value
 * @throws Error if value is not an integer or out of range
 *
 * @example
 * ```typescript
 * const value = Uint.fromNumber(255);
 * ```
 */
export function fromNumber(value: number): BrandedUint256 {
	if (!Number.isInteger(value)) {
		throw new Error(`Uint256 value must be an integer: ${value}`);
	}
	return from(value);
}
