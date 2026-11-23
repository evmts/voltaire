import { bn254 } from "@noble/curves/bn254.js";
import { FP_MOD } from "../constants.js";
import { Bn254Error } from "../errors.js";

const FP12_SIZE = FP_MOD ** 12n;

/**
 * Decode the canonical integer produced by `encodeFp12` back to an Fp12
 * element.
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {bigint} value - Canonical integer in `[0, p^12)`
 * @returns {import('@noble/curves/abstract/tower.js').Fp12} Fp12 element
 * @throws {Bn254Error} If the value is outside `[0, p^12)`
 * @example
 * ```javascript
 * import { decodeFp12 } from './crypto/bn254/Pairing/decodeFp12.js';
 * const one = decodeFp12(1n);
 * ```
 */
export function decodeFp12(value) {
	if (typeof value !== "bigint" || value < 0n || value >= FP12_SIZE) {
		throw new Bn254Error("Pairing result is not a canonical Fp12 element", {
			code: "INVALID_PAIRING_RESULT",
			context: { expected: "bigint in [0, p^12)" },
			docsPath: "/crypto/bn254#pairing",
		});
	}
	/** @type {bigint[]} */
	const coefficients = [];
	let rest = value;
	for (let i = 0; i < 12; i++) {
		coefficients.push(rest % FP_MOD);
		rest /= FP_MOD;
	}
	return bn254.fields.Fp12.fromBigTwelve(
		/** @type {import('@noble/curves/abstract/tower.js').BigintTwelve} */ (
			coefficients
		),
	);
}
