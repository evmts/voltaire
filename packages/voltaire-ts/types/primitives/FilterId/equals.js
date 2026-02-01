/**
 * Compare two FilterIds for equality
 *
 * @param {import('./FilterIdType.js').FilterIdType} a
 * @param {import('./FilterIdType.js').FilterIdType} b
 * @returns {boolean}
 * @example
 * ```javascript
 * import * as FilterId from './primitives/FilterId/index.js';
 * const equal = FilterId.equals(id1, id2);
 * ```
 */
export function equals(a, b) {
    return a === b;
}
