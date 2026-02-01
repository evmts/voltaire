/**
 * Check if G2 point is on curve: y^2 = x^3 + b where b = 3/(9+u)
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../G2PointType.js').G2PointType} point - Point to check
 * @returns {boolean} True if on curve
 * @throws {never}
 * @example
 * ```javascript
 * import * as G2 from './crypto/bn254/G2/index.js';
 * const point = G2.generator();
 * if (G2.isOnCurve(point)) {
 *   console.log('Point is on curve');
 * }
 * ```
 */
export function isOnCurve(point: import("../G2PointType.js").G2PointType): boolean;
//# sourceMappingURL=isOnCurve.d.ts.map