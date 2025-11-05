import { isBefore } from "./isBefore.js";

/**
 * Check if hardfork is before the specified version (convenience form)
 *
 * @this {import('./BrandedHardfork.js').BrandedHardfork}
 * @param {import('./BrandedHardfork.js').BrandedHardfork} target - Target hardfork to compare against
 * @returns {boolean} true if this < target
 *
 * @example
 * ```typescript
 * import { BERLIN, LONDON, lt } from './hardfork.js';
 *
 * lt.call(BERLIN, LONDON); // true
 * ```
 */
export function lt(target) {
	return isBefore(this, target);
}
