import * as Fr from "../Fr/index.js";
import * as G1 from "../G1/index.js";
import * as G2 from "../G2/index.js";
import { CURVE_PARAM_T } from "../constants.js";
import { pairingResultOne } from "./pairingResult.js";

/**
 * Miller loop computation (simplified)
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../BrandedG1Point.js').BrandedG1Point} p - G1 point
 * @param {import('../BrandedG2Point.js').BrandedG2Point} q - G2 point
 * @returns {{value: bigint}} Miller loop result
 * @throws {never}
 * @example
 * ```javascript
 * import * as Pairing from './crypto/bn254/Pairing/index.js';
 * import * as G1 from './crypto/bn254/G1/index.js';
 * import * as G2 from './crypto/bn254/G2/index.js';
 * const result = Pairing.millerLoop(G1.generator(), G2.generator());
 * ```
 */
export function millerLoop(p, q) {
	if (G1.isZero(p) || G2.isZero(q)) {
		return pairingResultOne();
	}

	const p_aff = G1.toAffine(p);
	const q_aff = G2.toAffine(q);

	let f = 1n;
	const t_bits = CURVE_PARAM_T.toString(2);

	for (let i = 1; i < t_bits.length; i++) {
		f = Fr.mul(Fr.mul(f, f), p_aff.x);

		if (t_bits[i] === "1") {
			f = Fr.mul(f, q_aff.x.c0);
		}
	}

	return { value: f };
}
