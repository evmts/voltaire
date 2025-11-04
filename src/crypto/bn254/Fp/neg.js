import { FP_MOD } from "../constants.js";

/**
 * Negate a field element in Fp
 *
 * @param {bigint} a - Element to negate
 * @returns {bigint} -a mod FP_MOD
 *
 * @example
 * ```typescript
 * const negated = neg(123n);
 * ```
 */
export function neg(a) {
	return a === 0n ? 0n : FP_MOD - a;
}
