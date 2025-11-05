import { HARDFORK_ORDER } from "./constants.js";

/**
 * Check if current hardfork is at least the specified version
 *
 * @param {import('./BrandedHardfork.js').BrandedHardfork} current - Current hardfork
 * @param {import('./BrandedHardfork.js').BrandedHardfork} target - Target hardfork to compare against
 * @returns {boolean} true if current >= target
 *
 * @example
 * ```typescript
 * import { CANCUN, SHANGHAI, isAtLeast } from './hardfork.js';
 *
 * if (isAtLeast(CANCUN, SHANGHAI)) {
 *   // PUSH0 opcode is available
 * }
 * ```
 */
export function isAtLeast(current, target) {
	return HARDFORK_ORDER.indexOf(current) >= HARDFORK_ORDER.indexOf(target);
}
