import { FP_MOD } from "../constants.js";
import { Bn254Error } from "../errors.js";
import { pow } from "./pow.js";

/**
 * Multiplicative inverse in Fp using Fermat's little theorem
 *
 * @param {bigint} a - Element to invert
 * @returns {bigint} a^(-1) mod FP_MOD
 * @throws {Bn254Error} If a is zero
 *
 * @example
 * ```typescript
 * const inverse = inv(123n);
 * ```
 */
export function inv(a) {
	if (a === 0n) throw new Bn254Error("Division by zero");
	return pow(a, FP_MOD - 2n);
}
