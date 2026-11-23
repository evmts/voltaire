import { FP_MOD } from "../constants.js";

/**
 * Encode an Fp12 element as its canonical integer: the twelve Fp coefficients
 * read as base-`p` digits, least significant first, in tower order
 * `c0.c0.c0, c0.c0.c1, c0.c1.c0, ..., c1.c2.c1`. The multiplicative identity
 * encodes as `1n`.
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('@noble/curves/abstract/tower.js').Fp12} f - Fp12 element
 * @returns {bigint} Canonical integer in `[0, p^12)`
 * @throws {never}
 * @example
 * ```javascript
 * import { bn254 } from '@noble/curves/bn254.js';
 * import { encodeFp12 } from './crypto/bn254/Pairing/encodeFp12.js';
 * encodeFp12(bn254.fields.Fp12.ONE); // 1n
 * ```
 */
export function encodeFp12(f) {
	const coefficients = [
		f.c0.c0.c0,
		f.c0.c0.c1,
		f.c0.c1.c0,
		f.c0.c1.c1,
		f.c0.c2.c0,
		f.c0.c2.c1,
		f.c1.c0.c0,
		f.c1.c0.c1,
		f.c1.c1.c0,
		f.c1.c1.c1,
		f.c1.c2.c0,
		f.c1.c2.c1,
	];
	let value = 0n;
	for (let i = coefficients.length - 1; i >= 0; i--) {
		value = value * FP_MOD + /** @type {bigint} */ (coefficients[i]);
	}
	return value;
}
