/**
 * Create G2 point from affine coordinates with validation
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../Fp2.js').Fp2} x - X coordinate (Fp2 element)
 * @param {import('../Fp2.js').Fp2} y - Y coordinate (Fp2 element)
 * @returns {import('../G2PointType.js').G2PointType} G2 point
 * @throws {Bn254InvalidPointError} If point not on bn254 G2 curve
 * @throws {Bn254SubgroupCheckError} If point not in G2 subgroup
 * @example
 * ```javascript
 * import * as G2 from './crypto/bn254/G2/index.js';
 * import * as Fp2 from './crypto/bn254/Fp2/index.js';
 * const x = Fp2.create(1n, 2n);
 * const y = Fp2.create(3n, 4n);
 * const point = G2.fromAffine(x, y);
 * ```
 */
export function fromAffine(x: import("../Fp2.js").Fp2, y: import("../Fp2.js").Fp2): import("../G2PointType.js").G2PointType;
//# sourceMappingURL=fromAffine.d.ts.map