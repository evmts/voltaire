/**
 * Check if two G2 points are equal
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../G2PointType.js').G2PointType} point - First point
 * @param {import('../G2PointType.js').G2PointType} other - Second point
 * @returns {boolean} True if equal
 * @throws {never}
 * @example
 * ```javascript
 * import * as G2 from './crypto/bn254/G2/index.js';
 * const p1 = G2.generator();
 * const p2 = G2.generator();
 * if (G2.equal(p1, p2)) {
 *   console.log('Points are equal');
 * }
 * ```
 */
export function equal(point: import("../G2PointType.js").G2PointType, other: import("../G2PointType.js").G2PointType): boolean;
//# sourceMappingURL=equal.d.ts.map