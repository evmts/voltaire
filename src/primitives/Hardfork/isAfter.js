import { HARDFORK_ORDER } from "./constants.js";

/**
 * Check if current hardfork is after the specified version
 *
 * @param {import('./HardforkType.ts').HardforkType} current - Current hardfork
 * @param {import('./HardforkType.ts').HardforkType} target - Target hardfork to compare against
 * @returns {boolean} true if current > target
 *
 * @example
 * ```typescript
 * import { CANCUN, SHANGHAI, isAfter } from './hardfork.js';
 *
 * if (isAfter(CANCUN, SHANGHAI)) {
 *   // Blob transactions available
 * }
 * ```
 */
export function isAfter(current, target) {
	return HARDFORK_ORDER.indexOf(current) > HARDFORK_ORDER.indexOf(target);
}
