import { FP_MOD } from "../constants.js";
import { Bn254Error } from "../errors.js";
import { pow } from "./pow.js";

/**
 * Multiplicative inverse in Fp using Fermat's little theorem
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {bigint} a - Element to invert
 * @returns {bigint} a^(-1) mod FP_MOD
 * @throws {Bn254Error} If a is zero (division by zero)
 * @example
 * ```javascript
 * import * as Fp from './crypto/bn254/Fp/index.js';
 * const inverse = Fp.inv(123n);
 * ```
 */
export function inv(a) {
	if (a === 0n) {
		throw new Bn254Error("Division by zero in Fp field", {
			code: "DIVISION_BY_ZERO",
			context: { field: "Fp", value: a },
			docsPath: "/crypto/bn254#field-operations",
		});
	}
	return pow(a, FP_MOD - 2n);
}
