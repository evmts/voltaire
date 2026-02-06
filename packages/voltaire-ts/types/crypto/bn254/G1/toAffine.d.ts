/**
 * Convert G1 point to affine coordinates
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../G1PointType.js').G1PointType} point - Point in projective coordinates
 * @returns {import('../G1PointType.js').G1PointType} Point in affine coordinates
 * @throws {never}
 * @example
 * ```javascript
 * import * as G1 from './crypto/bn254/G1/index.js';
 * const point = G1.generator();
 * const affine = G1.toAffine(point);
 * ```
 */
export function toAffine(point: import("../G1PointType.js").G1PointType): import("../G1PointType.js").G1PointType;
//# sourceMappingURL=toAffine.d.ts.map