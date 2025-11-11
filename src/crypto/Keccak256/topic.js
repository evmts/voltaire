import { hashString } from "./hashString.js";

/**
 * Compute event topic (32-byte Keccak-256 hash)
 *
 * Used for Ethereum event signatures.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} signature - Event signature string
 * @returns {import('../../primitives/Hash/index.js').BrandedHash} 32-byte topic
 * @throws {never}
 * @example
 * ```javascript
 * import * as Keccak256 from './crypto/Keccak256/index.js';
 * const topic = Keccak256.topic('Transfer(address,address,uint256)');
 * ```
 */
export function topic(signature) {
	return hashString(signature);
}
