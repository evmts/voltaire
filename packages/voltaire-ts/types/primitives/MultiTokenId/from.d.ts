/**
 * Create MultiTokenId from bigint, number, or string
 *
 * @see https://voltaire.tevm.sh/primitives/multi-token-id for MultiTokenId documentation
 * @since 0.0.0
 * @param {bigint | number | string} value - bigint, number, or decimal/hex string
 * @returns {import('./MultiTokenIdType.js').MultiTokenIdType} MultiTokenId value
 * @throws {InvalidMultiTokenIdError} If value is out of range or invalid
 * @example
 * ```javascript
 * import * as MultiTokenId from './primitives/MultiTokenId/index.js';
 * const tokenId = MultiTokenId.from(1n); // Fungible token type
 * const nftId = MultiTokenId.from(2n ** 128n); // Non-fungible token type
 * const fromHex = MultiTokenId.from("0xff");
 * ```
 */
export function from(value: bigint | number | string): import("./MultiTokenIdType.js").MultiTokenIdType;
//# sourceMappingURL=from.d.ts.map