import { hashString } from "./hashString.js";

/**
 * Compute function selector (first 4 bytes of Keccak-256 hash)
 *
 * Used for Ethereum function signatures.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} signature - Function signature string
 * @returns {string} 4-byte selector as hex string
 * @throws {never}
 * @example
 * ```javascript
 * import * as Keccak256 from './crypto/Keccak256/index.js';
 * const selector = Keccak256.selector('transfer(address,uint256)');
 * // "0xa9059cbb"
 * ```
 */
export function selector(signature) {
	const digest = hashString(signature);
	const selectorBytes = digest.slice(0, 4);
	return `0x${Array.from(selectorBytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
}
