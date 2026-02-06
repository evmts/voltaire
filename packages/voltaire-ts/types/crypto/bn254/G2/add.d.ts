/**
 * Add two G2 points
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../G2PointType.js').G2PointType} point - First point
 * @param {import('../G2PointType.js').G2PointType} other - Second point
 * @returns {import('../G2PointType.js').G2PointType} Sum
 * @throws {never}
 * @example
 * ```javascript
 * import * as G2 from './crypto/bn254/G2/index.js';
 * const p1 = G2.generator();
 * const p2 = G2.double(p1);
 * const sum = G2.add(p1, p2);
 * ```
 */
export function add(point: import("../G2PointType.js").G2PointType, other: import("../G2PointType.js").G2PointType): import("../G2PointType.js").G2PointType;
//# sourceMappingURL=add.d.ts.map