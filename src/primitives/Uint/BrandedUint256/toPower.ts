import type { BrandedUint256 } from "./BrandedUint256.js";
import { MAX } from "./constants.js";

/**
 * Exponentiation
 *
 * @param uint - Base value
 * @param exponent - Exponent value
 * @returns uint^exponent mod 2^256
 *
 * @example
 * ```typescript
 * const base = Uint(2n);
 * const exp = Uint(8n);
 * const result1 = Uint.toPower(base, exp); // 256
 * const result2 = base.toPower(exp); // 256
 * ```
 */
export function toPower(
	uint: BrandedUint256,
	exponent: BrandedUint256,
): BrandedUint256 {
	let result = 1n;
	let b = uint as bigint;
	let e = exponent as bigint;

	while (e > 0n) {
		if (e & 1n) {
			result = (result * b) & (MAX as bigint);
		}
		b = (b * b) & (MAX as bigint);
		e = e >> 1n;
	}

	return result as BrandedUint256;
}
