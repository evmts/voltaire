import { bn254 } from "@noble/curves/bn254.js";
import { isOnCurve } from "./isOnCurve.js";
import { isZero } from "./isZero.js";
import { toAffine } from "./toAffine.js";

/**
 * Check if G2 point is in the order-r subgroup of the twist curve.
 *
 * The twist has a large cofactor, so on-curve points are almost never in the
 * subgroup. The check is `psi(P) == [6x^2]P` (untwist-Frobenius-twist
 * endomorphism), which holds exactly for points of order r.
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../G2PointType.js').G2PointType} point - Point to check
 * @returns {boolean} True if in subgroup
 * @throws {never}
 * @example
 * ```javascript
 * import * as G2 from './crypto/bn254/G2/index.js';
 * const point = G2.generator();
 * G2.isInSubgroup(point); // true
 * ```
 */
export function isInSubgroup(point) {
	if (isZero(point)) return true;
	if (!isOnCurve(point)) return false;

	const affine = toAffine(point);
	return bn254.G2.Point.fromAffine({
		x: affine.x,
		y: affine.y,
	}).isTorsionFree();
}
