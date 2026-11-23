/**
 * Validate G1/G2 pairs and convert them to `@noble/curves` points.
 *
 * Pairs holding a point at infinity contribute the identity to a pairing
 * product, so they are dropped.
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {ReadonlyArray<readonly [import('../G1PointType.js').G1PointType, import('../G2PointType.js').G2PointType]>} pairs - G1/G2 point pairs
 * @returns {{ g1: import('@noble/curves/abstract/weierstrass.js').WeierstrassPoint<bigint>, g2: import('@noble/curves/abstract/weierstrass.js').WeierstrassPoint<import('../Fp2.js').Fp2> }[]} Pairs for `bn254.pairingBatch`
 * @throws {Bn254InvalidPointError} If a point is not on its curve
 * @throws {Bn254SubgroupCheckError} If a G2 point is outside the order-r subgroup
 * @example
 * ```javascript
 * import { toNoblePairs } from './crypto/bn254/Pairing/toNoblePairs.js';
 * const pairs = toNoblePairs([[G1.generator(), G2.generator()]]);
 * ```
 */
export function toNoblePairs(pairs: ReadonlyArray<readonly [import("../G1PointType.js").G1PointType, import("../G2PointType.js").G2PointType]>): {
    g1: import("@noble/curves/abstract/weierstrass.js").WeierstrassPoint<bigint>;
    g2: import("@noble/curves/abstract/weierstrass.js").WeierstrassPoint<import("../Fp2.js").Fp2>;
}[];
//# sourceMappingURL=toNoblePairs.d.ts.map