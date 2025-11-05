import { HARDFORK_ORDER } from "./constants.js";

/**
 * Get all hardfork names
 *
 * @returns {string[]} Array of all hardfork names
 *
 * @example
 * ```typescript
 * import { allNames } from './hardfork.js';
 *
 * const names = allNames(); // ["frontier", "homestead", ...]
 * ```
 */
export function allNames() {
	return [...HARDFORK_ORDER];
}
