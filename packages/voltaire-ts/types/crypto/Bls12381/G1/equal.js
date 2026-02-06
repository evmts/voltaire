import * as Fp from "../Fp/index.js";
import { isZero } from "./isZero.js";
/**
 * Check if two G1 points are equal
 * In Jacobian coordinates: P1 = P2 iff X1*Z2^2 = X2*Z1^2 and Y1*Z2^3 = Y2*Z1^3
 *
 * @param {import('../G1PointType.js').G1PointType} p1 - First point
 * @param {import('../G1PointType.js').G1PointType} p2 - Second point
 * @returns {boolean}
 */
export function equal(p1, p2) {
    const p1Zero = isZero(p1);
    const p2Zero = isZero(p2);
    if (p1Zero && p2Zero)
        return true;
    if (p1Zero || p2Zero)
        return false;
    const z1_2 = Fp.mul(p1.z, p1.z);
    const z2_2 = Fp.mul(p2.z, p2.z);
    const z1_3 = Fp.mul(z1_2, p1.z);
    const z2_3 = Fp.mul(z2_2, p2.z);
    // X1*Z2^2 = X2*Z1^2
    const x1z2_2 = Fp.mul(p1.x, z2_2);
    const x2z1_2 = Fp.mul(p2.x, z1_2);
    if (x1z2_2 !== x2z1_2)
        return false;
    // Y1*Z2^3 = Y2*Z1^3
    const y1z2_3 = Fp.mul(p1.y, z2_3);
    const y2z1_3 = Fp.mul(p2.y, z1_3);
    return y1z2_3 === y2z1_3;
}
