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
 * @throws {Bn254Error} If a is zero
 * @example
 * ```javascript
 * import * as Fr from './crypto/bn254/Fr/index.js';
 * const inverse = Fr.inv(123n);
 * ```
 */
export function inv(a) {
	if (a === 0n) throw new Bn254Error("Division by zero");
	return pow(a, FR_MOD - 2n);
}
