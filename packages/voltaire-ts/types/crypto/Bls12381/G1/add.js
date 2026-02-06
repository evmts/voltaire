import * as Fp from "../Fp/index.js";
import { double_ } from "./double.js";
import { infinity } from "./infinity.js";
import { isZero } from "./isZero.js";
/**
 * Add two G1 points using Jacobian coordinates
 * Algorithm: https://hyperelliptic.org/EFD/g1p/auto-shortw-jacobian.html#addition-add-2007-bl
 *
 * @param {import('../G1PointType.js').G1PointType} p1 - First point
 * @param {import('../G1PointType.js').G1PointType} p2 - Second point
 * @returns {import('../G1PointType.js').G1PointType}
 */
export function add(p1, p2) {
    if (isZero(p1))
        return p2;
    if (isZero(p2))
        return p1;
    const { x: x1, y: y1, z: z1 } = p1;
    const { x: x2, y: y2, z: z2 } = p2;
    // z1z1 = Z1^2
    const z1z1 = Fp.mul(z1, z1);
    // z2z2 = Z2^2
    const z2z2 = Fp.mul(z2, z2);
    // u1 = X1*Z2Z2
    const u1 = Fp.mul(x1, z2z2);
    // u2 = X2*Z1Z1
    const u2 = Fp.mul(x2, z1z1);
    // s1 = Y1*Z2*Z2Z2
    const s1 = Fp.mul(Fp.mul(y1, z2), z2z2);
    // s2 = Y2*Z1*Z1Z1
    const s2 = Fp.mul(Fp.mul(y2, z1), z1z1);
    // h = U2-U1
    const h = Fp.sub(u2, u1);
    // r = S2-S1
    const r = Fp.sub(s2, s1);
    // If h = 0
    if (h === 0n) {
        // If r = 0, points are same, return double
        if (r === 0n)
            return double_(p1);
        // Otherwise, P1 = -P2, return infinity
        return infinity();
    }
    // hh = H^2
    const hh = Fp.mul(h, h);
    // hhh = H*HH
    const hhh = Fp.mul(h, hh);
    // u1hh = U1*HH
    const u1hh = Fp.mul(u1, hh);
    // X3 = R^2 - HHH - 2*U1HH
    const x3 = Fp.sub(Fp.sub(Fp.mul(r, r), hhh), Fp.mul(2n, u1hh));
    // Y3 = R*(U1HH-X3) - S1*HHH
    const y3 = Fp.sub(Fp.mul(r, Fp.sub(u1hh, x3)), Fp.mul(s1, hhh));
    // Z3 = Z1*Z2*H
    const z3 = Fp.mul(Fp.mul(z1, z2), h);
    return /** @type {import('../G1PointType.js').G1PointType} */ ({
        x: x3,
        y: y3,
        z: z3,
    });
}
