/**
 * Multi-pairing: compute product of pairings
 *
 * More efficient than computing pairings individually
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {Array<[import('../G1PointType.js').G1PointType, import('../G2PointType.js').G2PointType]>} pairs - Array of G1/G2 point pairs
 * @returns {{value: bigint}} Pairing result
 * @throws {never}
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