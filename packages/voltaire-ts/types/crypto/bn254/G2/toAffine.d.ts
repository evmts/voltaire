/**
 * Convert G2 point to affine coordinates
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../G2PointType.js').G2PointType} point - Point in projective coordinates
 * @returns {import('../G2PointType.js').G2PointType} Point in affine coordinates
 * @throws {never}
 * @example
 * ```javascript
 * import * as G2 from './crypto/bn254/G2/index.js';
 * const point = G2.generator();
 * const affine = G2.toAffine(point);
 * ```
 */
export function toAffine(point: import("../G2PointType.js").G2PointType): import("../G2PointType.js").G2PointType;
//# sourceMappingURL=toAffine.d.ts.map