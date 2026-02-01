/**
 * Add two G1 points
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../G1PointType.js').G1PointType} point - First point
 * @param {import('../G1PointType.js').G1PointType} other - Second point
 * @returns {import('../G1PointType.js').G1PointType} Sum
 * @throws {never}
 * @example
 * ```javascript
 * import * as G1 from './crypto/bn254/G1/index.js';
 * const p1 = G1.generator();
 * const p2 = G1.double(p1);
 * const sum = G1.add(p1, p2);
 * ```
 */
export function add(point: import("../G1PointType.js").G1PointType, other: import("../G1PointType.js").G1PointType): import("../G1PointType.js").G1PointType;
//# sourceMappingURL=add.d.ts.map