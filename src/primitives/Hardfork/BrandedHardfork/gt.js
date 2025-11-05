import { isAfter } from "./isAfter.js";

/**
 * Check if hardfork is after the specified version (convenience form)
 *
 * @this {import('./BrandedHardfork.js').BrandedHardfork}
 * @param {import('./BrandedHardfork.js').BrandedHardfork} target - Target hardfork to compare against
 * @returns {boolean} true if this > target
 *
 * @example
 * ```typescript
 * import { CANCUN, SHANGHAI, gt } from './hardfork.js';
 *
 * gt.call(CANCUN, SHANGHAI); // true
 * ```
 */
export function gt(target) {
	return isAfter(this, target);
}
