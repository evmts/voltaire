import { hashString } from "./hashString.js";

/**
 * Compute function selector (first 4 bytes of Keccak-256 hash)
 *
 * Used for Ethereum function signatures.
 *
 * @param {string} signature - Function signature string
 * @returns {Uint8Array} 4-byte selector
 *
 * @example
 * ```typescript
 * const selector = Keccak256.selector('transfer(address,uint256)');
 * // Uint8Array([0xa9, 0x05, 0x9c, 0xbb])
 * ```
 */
export function selector(signature) {
	const digest = hashString(signature);
	return digest.slice(0, 4);
}
