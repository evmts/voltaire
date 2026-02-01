/**
 * Get range of hardforks between two versions (inclusive)
 *
 * @param {import('./HardforkType.js').HardforkType} start - Start hardfork
 * @param {import('./HardforkType.js').HardforkType} end - End hardfork
 * @returns {import('./HardforkType.js').HardforkType[]} Array of hardfork IDs in range
 * @throws {InvalidFormatError} If start or end hardfork is invalid
 *
 * @example
 * ```typescript
 * import { BERLIN, SHANGHAI, range } from './hardfork.js';
 *
 * const r = range(BERLIN, SHANGHAI);
 * // [BERLIN, LONDON, ARROW_GLACIER, GRAY_GLACIER, MERGE, SHANGHAI]
 * ```
 */
export function range(start: import("./HardforkType.js").HardforkType, end: import("./HardforkType.js").HardforkType): import("./HardforkType.js").HardforkType[];
//# sourceMappingURL=range.d.ts.map