/**
 * Check if two TokenId values are equal
 *
 * @see https://voltaire.tevm.sh/primitives/token-id for TokenId documentation
 * @since 0.0.0
 * @param {import('./TokenIdType.js').TokenIdType} a - First TokenId
 * @param {import('./TokenIdType.js').TokenIdType} b - Second TokenId
 * @returns {boolean} true if equal
 * @example
 * ```javascript
 * import * as TokenId from './primitives/TokenId/index.js';
 * const a = TokenId.from(42n);
 * const b = TokenId.from(42n);
 * const result = TokenId.equals(a, b); // true
 * ```
 */
export function equals(a, b) {
    return a === b;
}
