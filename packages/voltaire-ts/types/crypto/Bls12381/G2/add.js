import * as Fp2 from "../Fp2/index.js";
import { double_ } from "./double.js";
import { infinity } from "./infinity.js";
import { isZero } from "./isZero.js";
/**
 * Add two G2 points using Jacobian coordinates
 * Algorithm: https://hyperelliptic.org/EFD/g1p/auto-shortw-jacobian.html#addition-add-2007-bl
 *
 * @param {import('../G2PointType.js').G2PointType} p1 - First point
 * @param {import('../G2PointType.js').G2PointType} p2 - Second point
 * @returns {import('../G2PointType.js').G2PointType}
 */
export function add(p1, p2) {
    if (isZero(p1))
        return p2;
    if (isZero(p2))
        return p1;
    const { x: x1, y: y1, z: z1 } = p1;
    const { x: x2, y: y2, z: z2 } = p2;
    // z1z1 = Z1^2
    const z1z1 = Fp2.square(z1);
    // z2z2 = Z2^2
    const z2z2 = Fp2.square(z2);
    // u1 = X1*Z2Z2
    const u1 = Fp2.mul(x1, z2z2);
    // u2 = X2*Z1Z1
    const u2 = Fp2.mul(x2, z1z1);
    // s1 = Y1*Z2*Z2Z2
    const s1 = Fp2.mul(Fp2.mul(y1, z2), z2z2);
    // s2 = Y2*Z1*Z1Z1
    const s2 = Fp2.mul(Fp2.mul(y2, z1), z1z1);
    // h = U2-U1
    const h = Fp2.sub(u2, u1);
    // r = S2-S1
    const r = Fp2.sub(s2, s1);
    // If h = 0
    if (Fp2.isZero(h)) {
        // If r = 0, points are same, return double
        if (Fp2.isZero(r))
            return double_(p1);
        // Otherwise, P1 = -P2, return infinity
        return infinity();
    }
    // hh = H^2
    const hh = Fp2.square(h);
    // hhh = H*HH
    const hhh = Fp2.mul(h, hh);
    // u1hh = U1*HH
    const u1hh = Fp2.mul(u1, hh);
    // X3 = R^2 - HHH - 2*U1HH
    const x3 = Fp2.sub(Fp2.sub(Fp2.square(r), hhh), Fp2.mulScalar(u1hh, 2n));
    // Y3 = R*(U1HH-X3) - S1*HHH
    const y3 = Fp2.sub(Fp2.mul(r, Fp2.sub(u1hh, x3)), Fp2.mul(s1, hhh));
    // Z3 = Z1*Z2*H
    const z3 = Fp2.mul(Fp2.mul(z1, z2), h);
    return /** @type {import('../G2PointType.js').G2PointType} */ ({
        x: x3,
        y: y3,
        z: z3,
    });
}
