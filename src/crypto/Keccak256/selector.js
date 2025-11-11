import { hashString } from "./hashString.js";

/**
 * Compute function selector (first 4 bytes of Keccak-256 hash)
 *
 * Used for Ethereum function signatures.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} signature - Function signature string
 * @returns {Uint8Array} 4-byte selector
 * @throws {never}
 * @example
 * ```javascript
 * import * as Keccak256 from './crypto/Keccak256/index.js';
 * const selector = Keccak256.selector('transfer(address,uint256)');
 * // Uint8Array([0xa9, 0x05, 0x9c, 0xbb])
 * ```
 */
export function selector(signature) {
	const digest = hashString(signature);
	return digest.slice(0, 4);
}
