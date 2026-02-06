/**
 * Create G1 point from affine coordinates with validation
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {bigint} x - X coordinate
 * @param {bigint} y - Y coordinate
 * @returns {import('../G1PointType.js').G1PointType} G1 point
 * @throws {Bn254InvalidPointError} If point not on bn254 G1 curve
 * @example
 * ```javascript
 * import * as G1 from './crypto/bn254/G1/index.js';
 * const point = G1.fromAffine(1n, 2n);
 * ```
 */
export function fromAffine(x: bigint, y: bigint): import("../G1PointType.js").G1PointType;
//# sourceMappingURL=fromAffine.d.ts.map