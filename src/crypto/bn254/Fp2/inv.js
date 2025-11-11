import * as Fp from "../Fp/index.js";
import { Bn254Error } from "../errors.js";
import { isZero } from "./isZero.js";

/**
 * Multiplicative inverse in Fp2
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../Fp2.js').Fp2} a - Element to invert
 * @returns {import('../Fp2.js').Fp2} Inverse
 * @throws {Bn254Error} If element is zero (division by zero)
 * @example
 * ```javascript
 * import * as Fp2 from './crypto/bn254/Fp2/index.js';
 * const a = { c0: 1n, c1: 2n };
 * const inverse = Fp2.inv(a);
 * ```
 */
export function inv(a) {
	if (isZero(a)) {
		throw new Bn254Error("Division by zero in Fp2 field", {
			code: "DIVISION_BY_ZERO",
			context: { field: "Fp2", value: a },
			docsPath: "/crypto/bn254#extension-field",
		});
	}
	const factor = Fp.inv(Fp.add(Fp.mul(a.c0, a.c0), Fp.mul(a.c1, a.c1)));
	return { c0: Fp.mul(a.c0, factor), c1: Fp.neg(Fp.mul(a.c1, factor)) };
}
