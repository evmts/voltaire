/**
 * Scalar multiplication of G1 point
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../G1PointType.js').G1PointType} point - Point to multiply
 * @param {bigint} scalar - Scalar multiplier
 * @returns {import('../G1PointType.js').G1PointType} Result
 * @throws {never}
 * @example
 * ```javascript
 * import * as G1 from './crypto/bn254/G1/index.js';
 * const point = G1.generator();
 * const result = G1.mul(point, 5n);
 * ```
 */
export function mul(point: import("../G1PointType.js").G1PointType, scalar: bigint): import("../G1PointType.js").G1PointType;
//# sourceMappingURL=mul.d.ts.map