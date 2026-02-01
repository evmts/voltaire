/**
 * Compare two hardforks
 *
 * @param {import('./HardforkType.js').HardforkType} a - First hardfork
 * @param {import('./HardforkType.js').HardforkType} b - Second hardfork
 * @returns {number} negative if a < b, zero if a == b, positive if a > b
 *
 * @example
 * ```typescript
 * import { BERLIN, LONDON, CANCUN, SHANGHAI, PRAGUE, compare } from './hardfork.js';
 *
 * compare(BERLIN, LONDON); // negative
 * compare(CANCUN, CANCUN); // 0
 * compare(PRAGUE, SHANGHAI); // positive
 * ```
 */
export function compare(a: import("./HardforkType.js").HardforkType, b: import("./HardforkType.js").HardforkType): number;
//# sourceMappingURL=compare.d.ts.map