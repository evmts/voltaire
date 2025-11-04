import { HARDFORK_ORDER } from "./constants.js";

/**
 * Compare two hardforks
 *
 * @param {import('./BrandedHardfork.js').BrandedHardfork} a - First hardfork
 * @param {import('./BrandedHardfork.js').BrandedHardfork} b - Second hardfork
 * @returns {number} negative if a < b, zero if a == b, positive if a > b
 *
 * @example
 * ```typescript
 * import { BERLIN, LONDON, CANCUN, SHANGHAI, PRAGUE, compare } from './hardfork.js';
 *
 * compare(BERLIN, LONDON); // negative
 * compare(CANCUN, CANCUN); // 0
 * compare(PRAGUE, SHANGHAI); // positive
 * ```
 */
export function compare(a, b) {
	return HARDFORK_ORDER.indexOf(a) - HARDFORK_ORDER.indexOf(b);
}
