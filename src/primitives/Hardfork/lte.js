import { isAtLeast } from "./isAtLeast.js";

/**
 * Check if hardfork is less than or equal to target (convenience form)
 *
 * @this {import('./HardforkType.ts').HardforkType}
 * @param {import('./HardforkType.ts').HardforkType} target - Target hardfork to compare against
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
