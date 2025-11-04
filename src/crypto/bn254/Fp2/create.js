import * as Fp from "../Fp/index.js";

/**
 * Create an Fp2 element
 *
 * @param {bigint} c0 - First component
 * @param {bigint} c1 - Second component
 * @returns {import('../Fp2.js').Fp2} Fp2 element
 *
 * @example
 * ```typescript
 * const elem = create(123n, 456n);
 * ```
 */
export function create(c0, c1) {
	return { c0: Fp.mod(c0), c1: Fp.mod(c1) };
}
