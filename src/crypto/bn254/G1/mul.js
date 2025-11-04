import * as Fr from "../Fr/index.js";
import { add } from "./add.js";
import { double } from "./double.js";
import { infinity } from "./infinity.js";
import { isZero } from "./isZero.js";

/**
 * Scalar multiplication of G1 point
 *
 * @param {import('../BrandedG1Point.js').BrandedG1Point} point - Point to multiply
 * @param {bigint} scalar - Scalar multiplier
 * @returns {import('../BrandedG1Point.js').BrandedG1Point} Result
 *
 * @example
 * ```typescript
 * const result = mul(point, 5n);
 * ```
 */
export function mul(point, scalar) {
	if (scalar === 0n || isZero(point)) return infinity();

	const s = Fr.mod(scalar);
	let result = infinity();
	let base = point;

	let n = s;
	while (n > 0n) {
		if (n & 1n) {
			result = add(result, base);
		}
		base = double(base);
		n >>= 1n;
	}

	return result;
}
