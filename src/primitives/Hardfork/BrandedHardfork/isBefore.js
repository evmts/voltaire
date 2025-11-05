import { HARDFORK_ORDER } from "./constants.js";

/**
 * Check if current hardfork is before the specified version
 *
 * @param {import('./BrandedHardfork.js').BrandedHardfork} current - Current hardfork
 * @param {import('./BrandedHardfork.js').BrandedHardfork} target - Target hardfork to compare against
 * @returns {boolean} true if current < target
 *
 * @example
 * ```typescript
 * import { BERLIN, LONDON, isBefore } from './hardfork.js';
 *
 * if (isBefore(BERLIN, LONDON)) {
 *   // EIP-1559 not available yet
 * }
 * ```
 */
export function isBefore(current, target) {
	return HARDFORK_ORDER.indexOf(current) < HARDFORK_ORDER.indexOf(target);
}
