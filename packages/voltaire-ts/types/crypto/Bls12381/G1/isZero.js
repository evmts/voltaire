/**
 * Check if a G1 point is the point at infinity
 *
 * @param {import('../G1PointType.js').G1PointType} point - Point to check
 * @returns {boolean}
 */
export function isZero(point) {
    return point.z === 0n;
}
