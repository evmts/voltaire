/**
 * Multi-pairing: product of optimal ate pairings `e(P1,Q1) * e(P2,Q2) * ...`
 *
 * Shares one Miller loop and one final exponentiation across all pairs. The
 * result is an element of GT encoded as a canonical integer (see `encodeFp12`);
 * the empty product is the identity `1n`.
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {Array<[import('../G1PointType.js').G1PointType, import('../G2PointType.js').G2PointType]>} pairs - Array of G1/G2 point pairs
 * @returns {{value: bigint}} Pairing result
 * @throws {import('../errors.js').Bn254InvalidPointError} If a point is not on its curve
 * @throws {import('../errors.js').Bn254SubgroupCheckError} If a G2 point is outside the subgroup
 * @example
 * ```javascript
 * import * as Pairing from './crypto/bn254/Pairing/index.js';
 * import * as G1 from './crypto/bn254/G1/index.js';
 * import * as G2 from './crypto/bn254/G2/index.js';
 * const p1 = G1.generator();
 * const q1 = G2.generator();
 * const p2 = G1.mul(p1, 2n);
 * const q2 = G2.mul(q1, 3n);
 * const result = Pairing.multiPairing([[p1, q1], [p2, q2]]);
 * ```
 */
export function multiPairing(pairs: Array<[import("../G1PointType.js").G1PointType, import("../G2PointType.js").G2PointType]>): {
    value: bigint;
};
//# sourceMappingURL=multiPairing.d.ts.map