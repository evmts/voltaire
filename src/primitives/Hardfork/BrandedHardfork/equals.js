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
 * import { CANCUN, equals } from './hardfork.js';
 *
 * equals.call(CANCUN, CANCUN); // true
 * ```
 */
export function equals(other) {
	return isEqual(this, other);
}
