import * as Fp from "../Fp/index.js";
import { isZero } from "./isZero.js";
/**
 * Negate a G1 point (reflect over x-axis)
 *
 * @param {import('../G1PointType.js').G1PointType} point - Point to negate
 * @returns {import('../G1PointType.js').G1PointType}
 */
export function negate(point) {
    if (isZero(point))
        return point;
    return /** @type {import('../G1PointType.js').G1PointType} */ ({
        x: point.x,
        y: Fp.neg(point.y),
        z: point.z,
    });
}
