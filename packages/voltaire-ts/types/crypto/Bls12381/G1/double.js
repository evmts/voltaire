import * as Fp from "../Fp/index.js";
import { infinity } from "./infinity.js";
import { isZero } from "./isZero.js";
/**
 * Double a G1 point using Jacobian coordinates
 * Algorithm: https://hyperelliptic.org/EFD/g1p/auto-shortw-jacobian.html#doubling-dbl-2007-bl
 *
 * @param {import('../G1PointType.js').G1PointType} point - Point to double
 * @returns {import('../G1PointType.js').G1PointType}
 */
export function double_(point) {
    if (isZero(point))
        return infinity();
    const { x, y, z } = point;
    // 2P = O if y = 0
    if (y === 0n)
        return infinity();
    // xx = X1^2
    const xx = Fp.mul(x, x);
    // yy = Y1^2
    const yy = Fp.mul(y, y);
    // yyyy = YY^2
    const yyyy = Fp.mul(yy, yy);
    // zz = Z1^2
    const zz = Fp.mul(z, z);
    // s = 2*((X1+YY)^2-XX-YYYY)
    const s = Fp.mul(2n, Fp.sub(Fp.sub(Fp.mul(Fp.add(x, yy), Fp.add(x, yy)), xx), yyyy));
    // m = 3*XX (b=4 for BLS12-381, so a=0 term vanishes)
    const m = Fp.mul(3n, xx);
    // X3 = M^2-2*S
    const x3 = Fp.sub(Fp.mul(m, m), Fp.mul(2n, s));
    // Y3 = M*(S-X3)-8*YYYY
    const y3 = Fp.sub(Fp.mul(m, Fp.sub(s, x3)), Fp.mul(8n, yyyy));
    // Z3 = (Y1+Z1)^2-YY-ZZ
    const z3 = Fp.sub(Fp.sub(Fp.mul(Fp.add(y, z), Fp.add(y, z)), yy), zz);
    return /** @type {import('../G1PointType.js').G1PointType} */ ({
        x: x3,
        y: y3,
        z: z3,
    });
}
// Export as double since double is a reserved word
export { double_ as double };
