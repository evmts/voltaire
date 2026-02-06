/**
 * Create BlockFilter from filter ID
 *
 * @param {import('../FilterId/FilterIdType.js').FilterIdType} filterId - Filter identifier from eth_newBlockFilter
 * @returns {import('./BlockFilterType.js').BlockFilterType}
 * @example
 * ```javascript
 * import * as BlockFilter from './primitives/BlockFilter/index.js';
 * import * as FilterId from './primitives/FilterId/index.js';
 * const filter = BlockFilter.from(FilterId.from("0x1"));
 * ```
 */
export function from(filterId) {
    return /** @type {import('./BlockFilterType.js').BlockFilterType} */ ({
        filterId,
        type: "block",
    });
}
