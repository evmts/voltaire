import { FR_MOD } from "../constants.js";

/**
 * Negate scalar field element
 *
 * @param {bigint} a - Element to negate
 * @returns {bigint} -a mod FR_MOD
 *
 * @example
 * ```typescript
 * const negated = neg(123n);
 * ```
 */
export function neg(a) {
	return a === 0n ? 0n : FR_MOD - a;
}
