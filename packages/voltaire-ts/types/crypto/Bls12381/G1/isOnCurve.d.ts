/**
 * Check if a G1 point is on the curve y^2 = x^3 + 4
 * In Jacobian projective coordinates where (X, Y, Z) represents (X/Z^2, Y/Z^3):
 * Y^2 = X^3 + b*Z^6
 *
 * @param {import('../G1PointType.js').G1PointType} point - Point to check
 * @returns {boolean}
 */
export function isOnCurve(point: import("../G1PointType.js").G1PointType): boolean;
//# sourceMappingURL=isOnCurve.d.ts.map