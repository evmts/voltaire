import * as Keccak256 from "../../../crypto/Keccak256/index.js";
import { format } from "./format.js";

/**
 * Get the EIP-191 personal sign message hash
 *
 * @param {import('./BrandedMessage.js').BrandedMessage} message - Message to hash
 * @returns {Uint8Array} Message hash ready for signing with EIP-191 prefix
 *
 * @example
 * ```typescript
 * const hash = getMessageHash(message);
 * // Returns hash with "\x19Ethereum Signed Message:\n" prefix
 * ```
 */
export function getMessageHash(message) {
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
	return Keccak256.hash(fullMessage);
}
