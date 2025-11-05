import { isAtLeast } from "./isAtLeast.js";

/**
 * Check if hardfork is at least the specified version (convenience form)
 *
 * @this {import('./BrandedHardfork.js').BrandedHardfork}
 * @param {import('./BrandedHardfork.js').BrandedHardfork} target - Target hardfork to compare against
 * @returns {boolean} true if this >= target
 *
 * @example
 * ```typescript
 * import { CANCUN, SHANGHAI, gte } from './hardfork.js';
 *
 * gte.call(CANCUN, SHANGHAI); // true
 * ```
 */
export function gte(target) {
	return isAtLeast(this, target);
}
