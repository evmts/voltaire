import { mod } from "./mod.js";

/**
 * Add two scalar field elements
 *
 * @param {bigint} a - First element
 * @param {bigint} b - Second element
 * @returns {bigint} (a + b) mod FR_MOD
 *
 * @example
 * ```typescript
 * const sum = add(123n, 456n);
 * ```
 */
export function add(a, b) {
	return mod(a + b);
}
