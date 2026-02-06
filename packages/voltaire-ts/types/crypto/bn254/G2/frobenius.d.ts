/**
 * Frobenius endomorphism for G2
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../G2PointType.js').G2PointType} point - Point
 * @param {bigint} power - Number of times to apply frobenius
 * @returns {import('../G2PointType.js').G2PointType} Frobenius map result
 * @throws {never}
 * @example
 * ```javascript
 * import * as G2 from './crypto/bn254/G2/index.js';
 * const point = G2.generator();
 * const frob = G2.frobenius(point, 1n);
 * ```
 */
export function frobenius(point: import("../G2PointType.js").G2PointType, power?: bigint): import("../G2PointType.js").G2PointType;
//# sourceMappingURL=frobenius.d.ts.map