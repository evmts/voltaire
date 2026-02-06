/**
 * Check if topic filter is empty (all wildcards)
 *
 * @param {import('./TopicFilterType.js').TopicFilterType} filter
 * @returns {boolean}
 * @example
 * ```javascript
 * import * as TopicFilter from './primitives/TopicFilter/index.js';
 * const empty = TopicFilter.isEmpty(filter); // true if all null/undefined
 * ```
 */
export function isEmpty(filter) {
    for (const entry of filter) {
        if (entry !== null && entry !== undefined) {
            return false;
        }
    }
    return true;
}
