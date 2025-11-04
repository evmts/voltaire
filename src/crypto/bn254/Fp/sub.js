import { mod } from "./mod.js";

/**
 * Subtract two field elements in Fp
 *
 * @param {bigint} a - First element
 * @param {bigint} b - Second element
 * @returns {bigint} (a - b) mod FP_MOD
 *
 * @example
 * ```typescript
 * const diff = sub(456n, 123n);
 * ```
 */
export function sub(a, b) {
	return mod(a - b);
}
