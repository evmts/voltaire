import { FP_MOD } from "../constants.js";
import { mod } from "./mod.js";
import { mul } from "./mul.js";
import { pow } from "./pow.js";

/**
 * Compute square root in Fp (if it exists)
 *
 * @param {bigint} a - Element to take square root of
 * @returns {bigint | null} Square root if it exists, null otherwise
 *
 * @example
 * ```typescript
 * const root = sqrt(4n);
 * ```
 */
export function sqrt(a) {
	const a_mod = mod(a);
	const exp = (FP_MOD + 1n) / 4n;
	const result = pow(a_mod, exp);
	if (mul(result, result) !== a_mod) return null;
	return result;
}
