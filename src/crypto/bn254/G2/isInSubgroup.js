import { FR_MOD } from "../constants.js";
import { isOnCurve } from "./isOnCurve.js";
import { isZero } from "./isZero.js";
import { mul } from "./mul.js";

/**
 * Check if G2 point is in the correct subgroup
 *
 * @param {import('../BrandedG2Point.js').BrandedG2Point} point - Point to check
 * @returns {boolean} True if in subgroup
 *
 * @example
 * ```typescript
 * if (isInSubgroup(point)) { }
 * ```
 */
export function isInSubgroup(point) {
	if (isZero(point)) return true;
	if (!isOnCurve(point)) return false;

	const orderMul = mul(point, FR_MOD);
	return isZero(orderMul);
}
