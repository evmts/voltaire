/**
 * Double a G1 point
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../G1PointType.js').G1PointType} point - Point to double
 * @returns {import('../G1PointType.js').G1PointType} Doubled point
 * @throws {never}
 * @example
 * ```javascript
 * import * as G1 from './crypto/bn254/G1/index.js';
 * const point = G1.generator();
 * const doubled = G1.double(point);
 * ```
 */
export function double(point: import("../G1PointType.js").G1PointType): import("../G1PointType.js").G1PointType;
//# sourceMappingURL=double.d.ts.map