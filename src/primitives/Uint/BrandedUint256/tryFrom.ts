import type { BrandedUint256 } from "./BrandedUint256.js";
import { from } from "./from.js";

/**
 * Try to create Uint256, returns undefined if invalid (standard form)
 *
 * @param value - bigint, number, or string
 * @returns Uint256 value or undefined
 *
 * @example
 * ```typescript
 * const a = Uint.tryFrom(100n); // Uint256
 * const b = Uint.tryFrom(-1n); // undefined
 * const c = Uint.tryFrom("invalid"); // undefined
 * ```
 */
export function tryFrom(
	value: bigint | number | string,
): BrandedUint256 | undefined {
	try {
		return from(value);
	} catch {
		return undefined;
	}
}
