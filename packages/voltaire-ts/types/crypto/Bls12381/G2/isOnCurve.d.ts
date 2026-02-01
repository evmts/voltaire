/**
 * Check if a G2 point is on the curve y^2 = x^3 + 4(1+i)
 * In Jacobian projective coordinates where (X, Y, Z) represents (X/Z^2, Y/Z^3):
 * Y^2 = X^3 + b*Z^6
 *
 * @param {import('../G2PointType.js').G2PointType} point - Point to check
 * @returns {boolean}
 */
export function isOnCurve(point: import("../G2PointType.js").G2PointType): boolean;
//# sourceMappingURL=isOnCurve.d.ts.map