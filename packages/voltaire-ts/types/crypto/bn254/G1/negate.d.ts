/**
 * Negate G1 point
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../G1PointType.js').G1PointType} point - Point to negate
 * @returns {import('../G1PointType.js').G1PointType} Negated point
 * @throws {never}
 * @example
 * ```javascript
 * import * as G1 from './crypto/bn254/G1/index.js';
 * const point = G1.generator();
 * const neg = G1.negate(point);
 * ```
 */
export function negate(point: import("../G1PointType.js").G1PointType): import("../G1PointType.js").G1PointType;
//# sourceMappingURL=negate.d.ts.map