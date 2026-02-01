/**
 * Get maximum hardfork from array
 *
 * @param {import('./HardforkType.js').HardforkType[]} forks - Array of hardforks
 * @returns {import('./HardforkType.js').HardforkType} Maximum (newest) hardfork
 * @throws {ValidationError} If array is empty
 *
 * @example
 * ```typescript
 * import { CANCUN, BERLIN, SHANGHAI, max } from './hardfork.js';
 *
 * const newest = max([CANCUN, BERLIN, SHANGHAI]); // CANCUN
 * ```
 */
export function max(forks: import("./HardforkType.js").HardforkType[]): import("./HardforkType.js").HardforkType;
//# sourceMappingURL=max.d.ts.map