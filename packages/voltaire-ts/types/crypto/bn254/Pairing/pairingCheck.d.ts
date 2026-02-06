/**
 * Pairing product check: e(P1,Q1) * e(P2,Q2) * ... = 1
 *
 * Used for zkSNARK verification
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {Array<[import('../G1PointType.js').G1PointType, import('../G2PointType.js').G2PointType]>} pairs - Array of G1/G2 point pairs
 * @returns {boolean} True if pairing product equals 1
 * @throws {never}
 * @example
 * ```javascript
 * import * as Pairing from './crypto/bn254/Pairing/index.js';
 * import * as G1 from './crypto/bn254/G1/index.js';
 * import * as G2 from './crypto/bn254/G2/index.js';
 * const p1 = G1.generator();
 * const q1 = G2.generator();
 * const p2 = G1.negate(p1);
 * const q2 = q1;
 * const valid = Pairing.pairingCheck([[p1, q1], [p2, q2]]);
 * ```
 */
export function pairingCheck(pairs: Array<[import("../G1PointType.js").G1PointType, import("../G2PointType.js").G2PointType]>): boolean;
//# sourceMappingURL=pairingCheck.d.ts.map