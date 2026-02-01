/**
 * Create TokenId from bigint, number, or string
 *
 * @see https://voltaire.tevm.sh/primitives/token-id for TokenId documentation
 * @since 0.0.0
 * @param {bigint | number | string} value - bigint, number, or decimal/hex string
 * @returns {import('./TokenIdType.js').TokenIdType} TokenId value
 * @throws {InvalidTokenIdError} If value is out of range or invalid
 * @example
 * ```javascript
 * import * as TokenId from './primitives/TokenId/index.js';
 * const tokenId = TokenId.from(42n);
 * const fromNumber = TokenId.from(100);
 * const fromHex = TokenId.from("0xff");
 * ```
 */
export function from(value: bigint | number | string): import("./TokenIdType.js").TokenIdType;
//# sourceMappingURL=from.d.ts.map