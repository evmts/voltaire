/**
 * Convert hash output to hex string
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} hash - Hash bytes
 * @returns {string} Hex string with 0x prefix
 * @throws {never}
 * @example
 * ```javascript
 * import { SHA256 } from './crypto/SHA256/index.js';
 * const hash = SHA256.hash(new Uint8Array([1, 2, 3]));
 * const hexStr = SHA256.toHex(hash);
 * console.log(hexStr); // "0x..."
 * ```
 */
export function toHex(hash) {
	return `0x${Array.from(hash)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
}
