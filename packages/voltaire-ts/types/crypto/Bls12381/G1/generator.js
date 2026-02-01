import { G1_GENERATOR_X, G1_GENERATOR_Y } from "../constants.js";
/**
 * Return the generator point for G1
 *
 * @returns {import('../G1PointType.js').G1PointType}
 */
export function generator() {
    return /** @type {import('../G1PointType.js').G1PointType} */ ({
        x: G1_GENERATOR_X,
        y: G1_GENERATOR_Y,
        z: 1n,
    });
}
