import { isAfter } from "./isAfter.js";

/**
 * Check if hardfork is after the specified version (convenience form)
 *
 * @this {import('./HardforkType.js').HardforkType}
 * @param {import('./HardforkType.js').HardforkType} target - Target hardfork to compare against
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
