import * as Fr from "../Fr/index.js";
import { add } from "./add.js";
import { double_ } from "./double.js";
import { infinity } from "./infinity.js";
import { isZero } from "./isZero.js";
/**
 * Scalar multiplication of G2 point using double-and-add
 *
 * @param {import('../G2PointType.js').G2PointType} point - Point to multiply
 * @param {bigint} scalar - Scalar multiplier
 * @returns {import('../G2PointType.js').G2PointType}
 */
export function mul(point, scalar) {
    if (scalar === 0n || isZero(point))
        return infinity();
    const s = Fr.mod(scalar);
    let result = infinity();
    let base = point;
    let n = s;
    while (n > 0n) {
        if (n & 1n) {
            result = add(result, base);
        }
        base = double_(base);
        n >>= 1n;
    }
    return result;
}
