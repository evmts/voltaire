import { FP_MOD } from "../constants.js";
import { pow } from "./pow.js";

/**
 * Compute modular inverse using Fermat's little theorem
 * a^(-1) = a^(p-2) mod p
 *
 * @param {bigint} a - Value to invert
 * @returns {bigint} a^(-1) mod p
 * @throws {Error} If a is zero
 */
export function inv(a) {
	if (a === 0n) {
		throw new Error("Cannot invert zero");
	}
	return pow(a, FP_MOD - 2n);
}
