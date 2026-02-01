/**
 * Check if hardfork is at least the specified version (convenience form)
 *
 * @this {import('./HardforkType.js').HardforkType}
 * @param {import('./HardforkType.js').HardforkType} target - Target hardfork to compare against
 * @returns {boolean} true if this >= target
 *
 * @example
 * ```typescript
 * import { CANCUN, SHANGHAI, gte } from './hardfork.js';
 *
 * gte.call(CANCUN, SHANGHAI); // true
 * ```
 */
export function gte(this: import("./HardforkType.js").HardforkType, target: import("./HardforkType.js").HardforkType): boolean;
//# sourceMappingURL=gte.d.ts.map