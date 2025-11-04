import { mod } from "./mod.js";

/**
 * Add two field elements in Fp
 *
 * @param {bigint} a - First element
 * @param {bigint} b - Second element
 * @returns {bigint} (a + b) mod FP_MOD
 *
 * @example
 * ```typescript
 * const sum = add(123n, 456n);
 * ```
 */
export function add(a, b) {
	return mod(a + b);
}
