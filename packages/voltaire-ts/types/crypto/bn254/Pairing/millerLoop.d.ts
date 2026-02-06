/**
 * Miller loop computation (simplified)
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../G1PointType.js').G1PointType} p - G1 point
 * @param {import('../G2PointType.js').G2PointType} q - G2 point
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
export function millerLoop(p: import("../G1PointType.js").G1PointType, q: import("../G2PointType.js").G2PointType): {
    value: bigint;
};
//# sourceMappingURL=millerLoop.d.ts.map