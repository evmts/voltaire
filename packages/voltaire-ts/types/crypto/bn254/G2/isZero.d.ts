/**
 * Check if G2 point is at infinity
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../G2PointType.js').G2PointType} point - Point to check
 * @returns {boolean} True if at infinity
 * @throws {never}
 * @example
 * ```javascript
 * import * as G2 from './crypto/bn254/G2/index.js';
 * const inf = G2.infinity();
 * if (G2.isZero(inf)) {
 *   console.log('Point is at infinity');
 * }
 * ```
 */
export function isZero(point: import("../G2PointType.js").G2PointType): boolean;
//# sourceMappingURL=isZero.d.ts.map