/**
 * Check if G1 point is on curve: y^2 = x^3 + 3
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../G1PointType.js').G1PointType} point - Point to check
 * @returns {boolean} True if on curve
 * @throws {never}
 * @example
 * ```javascript
 * import * as G1 from './crypto/bn254/G1/index.js';
 * const point = G1.generator();
 * if (G1.isOnCurve(point)) {
 *   console.log('Point is on curve');
 * }
 * ```
 */
export function isOnCurve(point: import("../G1PointType.js").G1PointType): boolean;
//# sourceMappingURL=isOnCurve.d.ts.map