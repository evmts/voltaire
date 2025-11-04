import * as Fp from "../Fp/index.js";

/**
 * Multiply Fp2 element by scalar
 *
 * @param {import('../Fp2.js').Fp2} a - Fp2 element
 * @param {bigint} scalar - Scalar value
 * @returns {import('../Fp2.js').Fp2} Product
 *
 * @example
 * ```typescript
 * const result = mulScalar(a, 2n);
 * ```
 */
export function mulScalar(a, scalar) {
	return { c0: Fp.mul(a.c0, scalar), c1: Fp.mul(a.c1, scalar) };
}
