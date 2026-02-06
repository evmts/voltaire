/**
 * Convert FilterId to string
 *
 * @param {import('./FilterIdType.js').FilterIdType} filterId
 * @returns {string}
 * @example
 * ```javascript
 * import * as FilterId from './primitives/FilterId/index.js';
 * const str = FilterId.toString(id); // "0x1"
 * ```
 */
// biome-ignore lint/suspicious/noShadowRestrictedNames: toString is the standard conversion method name for this module
export function toString(filterId) {
	return filterId;
}
