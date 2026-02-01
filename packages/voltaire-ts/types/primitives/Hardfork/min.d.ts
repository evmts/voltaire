/**
 * Get minimum hardfork from array
 *
 * @param {import('./HardforkType.js').HardforkType[]} forks - Array of hardforks
 * @returns {import('./HardforkType.js').HardforkType} Minimum (oldest) hardfork
 * @throws {ValidationError} If array is empty
 *
 * @example
 * ```typescript
 * import { CANCUN, BERLIN, SHANGHAI, min } from './hardfork.js';
 *
 * const oldest = min([CANCUN, BERLIN, SHANGHAI]); // BERLIN
 * ```
 */
export function min(forks: import("./HardforkType.js").HardforkType[]): import("./HardforkType.js").HardforkType;
//# sourceMappingURL=min.d.ts.map