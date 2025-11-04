import { isAtLeast } from "./isAtLeast.js";

/**
 * Check if hardfork is less than or equal to target (convenience form)
 *
 * @this {import('./BrandedHardfork.js').BrandedHardfork}
 * @param {import('./BrandedHardfork.js').BrandedHardfork} target - Target hardfork to compare against
 * @returns {boolean} true if this <= target
 *
 * @example
 * ```typescript
 * import { SHANGHAI, CANCUN, lte } from './hardfork.js';
 *
 * lte.call(SHANGHAI, CANCUN); // true
 * ```
 */
export function lte(target) {
	return !isAtLeast(this, target) || this === target;
}
