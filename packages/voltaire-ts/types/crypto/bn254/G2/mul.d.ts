/**
 * Scalar multiplication of G2 point
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../G2PointType.js').G2PointType} point - Point to multiply
 * @param {bigint} scalar - Scalar multiplier
 * @returns {import('../G2PointType.js').G2PointType} Result
 * @throws {never}
 * @example
 * ```javascript
 * import * as G2 from './crypto/bn254/G2/index.js';
 * const point = G2.generator();
 * const result = G2.mul(point, 5n);
 * ```
 */
export function mul(point: import("../G2PointType.js").G2PointType, scalar: bigint): import("../G2PointType.js").G2PointType;
//# sourceMappingURL=mul.d.ts.map