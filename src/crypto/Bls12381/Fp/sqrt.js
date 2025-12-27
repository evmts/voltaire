import { FP_MOD } from "../constants.js";
import { mul } from "./mul.js";
import { pow } from "./pow.js";

/**
 * For BLS12-381, p = 3 mod 4, so sqrt can be computed as a^((p+1)/4)
 * @type {bigint}
 */
const SQRT_EXP = (FP_MOD + 1n) / 4n;

/**
 * Compute square root in Fp (if it exists)
 * For BLS12-381, p = 3 mod 4, so we use Tonelli-Shanks simplification:
 * sqrt(a) = a^((p+1)/4) mod p
 *
 * @param {bigint} a - Value to take square root of
 * @returns {bigint | null} Square root if it exists, null otherwise
 */
export function sqrt(a) {
	if (a === 0n) return 0n;

	const root = pow(a, SQRT_EXP);

	// Verify the root is correct
	if (mul(root, root) !== a % FP_MOD) {
		return null;
	}

	return root;
}
