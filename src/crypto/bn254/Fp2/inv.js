import * as Fp from "../Fp/index.js";
import { Bn254Error } from "../errors.js";
import { isZero } from "./isZero.js";

/**
 * Multiplicative inverse in Fp2
 *
 * @param {import('../Fp2.js').Fp2} a - Element to invert
 * @returns {import('../Fp2.js').Fp2} Inverse
 * @throws {Bn254Error} If element is zero
 *
 * @example
 * ```typescript
 * const inverse = inv(a);
 * ```
 */
export function inv(a) {
	if (isZero(a)) throw new Bn254Error("Division by zero in Fp2");
	const factor = Fp.inv(Fp.add(Fp.mul(a.c0, a.c0), Fp.mul(a.c1, a.c1)));
	return { c0: Fp.mul(a.c0, factor), c1: Fp.neg(Fp.mul(a.c1, factor)) };
}
