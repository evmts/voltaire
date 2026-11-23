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
export function encodeFp12(f: import("@noble/curves/abstract/tower.js").Fp12): bigint;
//# sourceMappingURL=encodeFp12.d.ts.map