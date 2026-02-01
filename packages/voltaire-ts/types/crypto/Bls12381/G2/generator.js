import { G2_GENERATOR_X, G2_GENERATOR_Y } from "../constants.js";
/**
 * Return the generator point for G2
 *
 * @returns {import('../G2PointType.js').G2PointType}
 */
export function generator() {
    return /** @type {import('../G2PointType.js').G2PointType} */ ({
        x: G2_GENERATOR_X,
        y: G2_GENERATOR_Y,
        z: { c0: 1n, c1: 0n },
    });
}
