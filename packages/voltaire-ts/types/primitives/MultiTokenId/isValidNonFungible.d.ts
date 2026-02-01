/**
 * Check if MultiTokenId is valid for non-fungible tokens (at or above threshold)
 *
 * @see https://voltaire.tevm.sh/primitives/multi-token-id for MultiTokenId documentation
 * @since 0.0.0
 * @param {import('./MultiTokenIdType.js').MultiTokenIdType} tokenId - MultiTokenId value to check
 * @returns {boolean} true if likely non-fungible (>= 2^128)
 * @example
 * ```javascript
 * import * as MultiTokenId from './primitives/MultiTokenId/index.js';
 * const nonFungible = MultiTokenId.from(2n ** 128n);
 * const isNFT = MultiTokenId.isValidNonFungible(nonFungible); // true
 * const fungible = MultiTokenId.from(1n);
 * const notNFT = MultiTokenId.isValidNonFungible(fungible); // false
 * ```
 */
export function isValidNonFungible(tokenId: import("./MultiTokenIdType.js").MultiTokenIdType): boolean;
//# sourceMappingURL=isValidNonFungible.d.ts.map