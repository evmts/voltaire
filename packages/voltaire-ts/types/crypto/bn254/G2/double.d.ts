/**
 * Double a G2 point
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../G2PointType.js').G2PointType} point - Point to double
 * @returns {import('../G2PointType.js').G2PointType} Doubled point
 * @throws {never}
 * @example
 * ```javascript
 * import * as G2 from './crypto/bn254/G2/index.js';
 * const point = G2.generator();
 * const doubled = G2.double(point);
 * ```
 */
export function double(point: import("../G2PointType.js").G2PointType): import("../G2PointType.js").G2PointType;
//# sourceMappingURL=double.d.ts.map