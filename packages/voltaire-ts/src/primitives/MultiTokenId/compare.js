/**
 * Compare two MultiTokenId values
 *
 * @see https://voltaire.tevm.sh/primitives/multi-token-id for MultiTokenId documentation
 * @since 0.0.0
 * @param {import('./MultiTokenIdType.js').MultiTokenIdType} a - First MultiTokenId
 * @param {import('./MultiTokenIdType.js').MultiTokenIdType} b - Second MultiTokenId
 * @returns {number} -1 if a < b, 0 if a === b, 1 if a > b
 * @example
 * ```javascript
 * import * as MultiTokenId from './primitives/MultiTokenId/index.js';
 * const a = MultiTokenId.from(1n);
 * const b = MultiTokenId.from(100n);
 * const result = MultiTokenId.compare(a, b); // -1
 * ```
 */
export function compare(a, b) {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
}
