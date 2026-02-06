import { HARDFORK_ORDER } from "./constants.js";
/**
 * Get all hardfork IDs (alias for allNames)
 *
 * @returns {import('./HardforkType.js').HardforkType[]} Array of all hardfork IDs
 *
 * @example
 * ```typescript
 * import { allIds } from './hardfork.js';
 *
 * const ids = allIds(); // ["frontier", "homestead", ...]
 * ```
 */
export function allIds() {
    return [...HARDFORK_ORDER];
}
