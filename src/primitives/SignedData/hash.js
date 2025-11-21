import { PERSONAL_MESSAGE_PREFIX } from "./constants.js";

/**
 * Factory: Create EIP-191 personal message hash function
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(message: Uint8Array | string) => import('../Hash/HashType/HashType.js').HashType}
 */
export function Hash({ keccak256 }) {
	/**
	 * Create EIP-191 personal message hash
	 *
	 * Format: keccak256("\x19Ethereum Signed Message:\n" + len(message) + message)
	 *
	 * This is the most common form of EIP-191 (version 0x45) used by wallets
	 * for signing arbitrary messages. The prefix prevents the message from
	 * being a valid transaction.
	 *
	 * @param {Uint8Array | string} message - Message to hash
	 * @returns {import('../Hash/HashType/HashType.js').HashType} 32-byte keccak256 hash
	 *
	 * @example
	 * ```javascript
	 * import { Hash } from './primitives/SignedData/hash.js';
	 * import { hash as keccak256 } from './crypto/keccak256/hash.js';
	 *
	 * const hashMessage = Hash({ keccak256 });
	 * const msgHash = hashMessage('Hello, Ethereum!');
	 * ```
	 */
	return function hash(message) {
		// Convert string to bytes if needed
		const messageBytes =
			typeof message === "string" ? new TextEncoder().encode(message) : message;

		// Create length string
		const len = String(messageBytes.length);
		const lenBytes = new TextEncoder().encode(len);

		// Prefix bytes: "\x19Ethereum Signed Message:\n"
		const prefixBytes = new TextEncoder().encode(PERSONAL_MESSAGE_PREFIX);

		// Concatenate: prefix + len + message
		const totalLength =
			prefixBytes.length + lenBytes.length + messageBytes.length;
		const data = new Uint8Array(totalLength);
		data.set(prefixBytes, 0);
		data.set(lenBytes, prefixBytes.length);
		data.set(messageBytes, prefixBytes.length + lenBytes.length);

		// Hash the complete message
		return /** @type {import('../Hash/HashType/HashType.js').HashType} */ (
			keccak256(data)
		);
	};
}
