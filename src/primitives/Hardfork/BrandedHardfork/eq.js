import { isEqual } from "./isEqual.js";

/**
 * Check if two hardforks are equal (convenience form)
 *
 * @this {import('./BrandedHardfork.js').BrandedHardfork}
 * @param {import('./BrandedHardfork.js').BrandedHardfork} other - Second hardfork
 * @returns {boolean} true if this == other
 *
 * @example
 * ```typescript
 * import { CANCUN, eq } from './hardfork.js';
 *
 * eq.call(CANCUN, CANCUN); // true
 * ```
 */
export function eq(other) {
	return isEqual(this, other);
}
