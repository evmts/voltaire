/**
 * Compare two TokenId values
 *
 * @see https://voltaire.tevm.sh/primitives/token-id for TokenId documentation
 * @since 0.0.0
 * @param {import('./TokenIdType.js').TokenIdType} a - First TokenId
 * @param {import('./TokenIdType.js').TokenIdType} b - Second TokenId
 * @returns {number} -1 if a < b, 0 if a === b, 1 if a > b
 * @example
 * ```javascript
 * import * as TokenId from './primitives/TokenId/index.js';
 * const a = TokenId.from(42n);
 * const b = TokenId.from(100n);
 * const result = TokenId.compare(a, b); // -1
 * ```
 */
export function compare(a: import("./TokenIdType.js").TokenIdType, b: import("./TokenIdType.js").TokenIdType): number;
//# sourceMappingURL=compare.d.ts.map