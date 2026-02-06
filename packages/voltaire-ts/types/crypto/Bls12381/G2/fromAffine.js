import * as Fp from "../Fp/index.js";
/**
 * Create G2 point from affine coordinates
 *
 * @param {import('../Fp2Type.js').Fp2Type} x - x-coordinate (Fp2)
 * @param {import('../Fp2Type.js').Fp2Type} y - y-coordinate (Fp2)
 * @returns {import('../G2PointType.js').G2PointType}
 */
export function fromAffine(x, y) {
    return /** @type {import('../G2PointType.js').G2PointType} */ ({
        x: { c0: Fp.mod(x.c0), c1: Fp.mod(x.c1) },
        y: { c0: Fp.mod(y.c0), c1: Fp.mod(y.c1) },
        z: { c0: 1n, c1: 0n },
    });
}
