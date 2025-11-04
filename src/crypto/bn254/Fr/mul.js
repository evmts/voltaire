import { mod } from "./mod.js";

/**
 * Multiply two scalar field elements
 *
 * @param {bigint} a - First element
 * @param {bigint} b - Second element
 * @returns {bigint} (a * b) mod FR_MOD
 *
 * @example
 * ```typescript
 * const product = mul(123n, 456n);
 * ```
 */
export function mul(a, b) {
	return mod(a * b);
}
