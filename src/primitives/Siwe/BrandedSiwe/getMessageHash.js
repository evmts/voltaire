import { format } from "./format.js";

/**
 * Factory: Get the EIP-191 personal sign message hash
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(message: import('./BrandedMessage.js').BrandedMessage) => Uint8Array} Function that hashes SIWE messages with EIP-191 prefix
 */
export function GetMessageHash({ keccak256 }) {
	/**
	 * Get the EIP-191 personal sign message hash
	 *
	 * @see https://voltaire.tevm.sh/primitives/siwe for SIWE documentation
	 * @since 0.0.0
	 * @param {import('./BrandedMessage.js').BrandedMessage} message - Message to hash
	 * @returns {Uint8Array} Message hash ready for signing with EIP-191 prefix
	 * @throws {never}
	 * @example
	 * ```javascript
	 * import * as Siwe from './primitives/Siwe/index.js';
	 * const hash = Siwe.getMessageHash(message);
	 * // Returns hash with "\x19Ethereum Signed Message:\n" prefix
	 * ```
	 */
	return function getMessageHash(message) {
		// Format the message to text
		const messageText = format(message);

		// Create EIP-191 personal sign prefix: "\x19Ethereum Signed Message:\n{length}"
		const messageBytes = new TextEncoder().encode(messageText);
		const lengthString = messageBytes.length.toString();
		const lengthBytes = new TextEncoder().encode(lengthString);

		// Build the full message: prefix + length + message
		const prefix = new Uint8Array([0x19]); // "\x19"
		const ethSignedMessage = new TextEncoder().encode(
			"Ethereum Signed Message:\n",
		);

		const fullMessage = new Uint8Array(
			prefix.length +
				ethSignedMessage.length +
				lengthBytes.length +
				messageBytes.length,
		);

		let offset = 0;
		fullMessage.set(prefix, offset);
		offset += prefix.length;
		fullMessage.set(ethSignedMessage, offset);
		offset += ethSignedMessage.length;
		fullMessage.set(lengthBytes, offset);
		offset += lengthBytes.length;
		fullMessage.set(messageBytes, offset);

		// Hash with keccak256
		return keccak256(fullMessage);
	};
}
