import { FR_MOD } from "../constants.js";
import { Bn254Error } from "../errors.js";
import { pow } from "./pow.js";

/**
 * Multiplicative inverse in Fr
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {bigint} a - Element to invert
 * @returns {bigint} a^(-1) mod FR_MOD
 * @throws {Bn254Error} If a is zero (division by zero)
 * @example
 * ```javascript
 * import * as Fr from './crypto/bn254/Fr/index.js';
 * const inverse = Fr.inv(123n);
 * ```
 */
export function inv(a) {
	if (a === 0n) {
		throw new Bn254Error("Division by zero in Fr field", {
			code: "DIVISION_BY_ZERO",
			context: { field: "Fr", value: a },
			docsPath: "/crypto/bn254#scalar-field",
		});
	}
	return pow(a, FR_MOD - 2n);
}
