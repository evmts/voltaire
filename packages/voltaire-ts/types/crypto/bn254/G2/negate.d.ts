/**
 * Negate G2 point
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../G2PointType.js').G2PointType} point - Point to negate
 * @returns {import('../G2PointType.js').G2PointType} Negated point
 * @throws {never}
 * @example
 * ```javascript
 * import * as G2 from './crypto/bn254/G2/index.js';
 * const point = G2.generator();
 * const neg = G2.negate(point);
 * ```
 */
export function negate(point: import("../G2PointType.js").G2PointType): import("../G2PointType.js").G2PointType;
//# sourceMappingURL=negate.d.ts.map