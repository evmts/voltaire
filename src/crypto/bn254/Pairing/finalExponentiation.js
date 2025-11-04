import * as Fr from "../Fr/index.js";
import { FP_MOD, FR_MOD } from "../constants.js";

/**
 * Final exponentiation (simplified)
 *
 * @param {{value: bigint}} f - Miller loop result
 * @returns {{value: bigint}} Final exponentiation result
 *
 * @example
 * ```typescript
 * const result = finalExponentiation(f);
 * ```
 */
export function finalExponentiation(f) {
	const exp = (FP_MOD ** 12n - 1n) / FR_MOD;
	const result = Fr.pow(f.value, exp);
	return { value: result };
}
