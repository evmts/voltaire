/**
 * Check if hardfork is less than or equal to target (convenience form)
 *
 * @this {import('./HardforkType.js').HardforkType}
 * @param {import('./HardforkType.js').HardforkType} target - Target hardfork to compare against
 * @returns {boolean} true if this <= target
 *
 * @example
 * ```typescript
 * import { SHANGHAI, CANCUN, lte } from './hardfork.js';
 *
 * lte.call(SHANGHAI, CANCUN); // true
 * ```
 */
export function lte(this: import("./HardforkType.js").HardforkType, target: import("./HardforkType.js").HardforkType): boolean;
//# sourceMappingURL=lte.d.ts.map