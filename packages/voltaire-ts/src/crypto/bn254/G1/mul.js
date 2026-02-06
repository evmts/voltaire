import * as Fr from "../Fr/index.js";
import { add } from "./add.js";
import { double } from "./double.js";
import { infinity } from "./infinity.js";
import { isZero } from "./isZero.js";

/**
 * Scalar multiplication of G1 point
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../G1PointType.js').G1PointType} point - Point to multiply
 * @param {bigint} scalar - Scalar multiplier
 * @returns {import('../G1PointType.js').G1PointType} Result
 * @throws {never}
 * @example
 * ```javascript
 * import * as G1 from './crypto/bn254/G1/index.js';
 * const point = G1.generator();
 * const result = G1.mul(point, 5n);
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
