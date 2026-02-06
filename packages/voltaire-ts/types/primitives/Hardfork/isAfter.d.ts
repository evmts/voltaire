/**
 * Check if current hardfork is after the specified version
 *
 * @param {import('./HardforkType.js').HardforkType} current - Current hardfork
 * @param {import('./HardforkType.js').HardforkType} target - Target hardfork to compare against
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
export function isAfter(current: import("./HardforkType.js").HardforkType, target: import("./HardforkType.js").HardforkType): boolean;
//# sourceMappingURL=isAfter.d.ts.map