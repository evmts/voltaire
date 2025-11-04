import { hashString } from "./hashString.js";

/**
 * Compute event topic (32-byte Keccak-256 hash)
 *
 * Used for Ethereum event signatures.
 *
 * @param {string} signature - Event signature string
 * @returns {import('../../primitives/Hash/index.js').BrandedHash} 32-byte topic
 *
 * @example
 * ```typescript
 * const topic = Keccak256.topic('Transfer(address,address,uint256)');
 * ```
 */
export function topic(signature) {
	return hashString(signature);
}
