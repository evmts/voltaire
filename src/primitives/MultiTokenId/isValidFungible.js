import { FUNGIBLE_THRESHOLD } from "./constants.js";

/**
 * Check if MultiTokenId is valid for fungible tokens (below threshold)
 *
 * @see https://voltaire.tevm.sh/primitives/multi-token-id for MultiTokenId documentation
 * @since 0.0.0
 * @param {import('./MultiTokenIdType.js').MultiTokenIdType} tokenId - MultiTokenId value to check
 * @returns {boolean} true if likely fungible (below 2^128)
 * @example
 * ```javascript
 * import * as MultiTokenId from './primitives/MultiTokenId/index.js';
 * const fungible = MultiTokenId.from(1n);
 * const isFungible = MultiTokenId.isValidFungible(fungible); // true
 * const nonFungible = MultiTokenId.from(2n ** 128n);
 * const notFungible = MultiTokenId.isValidFungible(nonFungible); // false
 * ```
 */
export function isValidFungible(tokenId) {
	return tokenId > 0n && tokenId < FUNGIBLE_THRESHOLD;
}
