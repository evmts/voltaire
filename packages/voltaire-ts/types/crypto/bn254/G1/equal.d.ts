/**
 * Check if two G1 points are equal
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../G1PointType.js').G1PointType} point - First point
 * @param {import('../G1PointType.js').G1PointType} other - Second point
 * @returns {boolean} True if equal
 * @throws {never}
 * @example
 * ```javascript
 * import * as G1 from './crypto/bn254/G1/index.js';
 * const p1 = G1.generator();
 * const p2 = G1.generator();
 * if (G1.equal(p1, p2)) {
 *   console.log('Points are equal');
 * }
 * ```
 */
export function equal(point: import("../G1PointType.js").G1PointType, other: import("../G1PointType.js").G1PointType): boolean;
//# sourceMappingURL=equal.d.ts.map