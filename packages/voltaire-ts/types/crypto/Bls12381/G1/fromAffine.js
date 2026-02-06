import * as Fp from "../Fp/index.js";
/**
 * Create G1 point from affine coordinates
 *
 * @param {bigint} x - x-coordinate
 * @param {bigint} y - y-coordinate
 * @returns {import('../G1PointType.js').G1PointType}
 */
export function fromAffine(x, y) {
    return /** @type {import('../G1PointType.js').G1PointType} */ ({
        x: Fp.mod(x),
        y: Fp.mod(y),
        z: 1n,
    });
}
