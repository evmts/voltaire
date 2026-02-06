/**
 * EIP-191 Message Signing
 *
 * Signs messages with the Ethereum signed message prefix:
 * `keccak256("\x19Ethereum Signed Message:\n" + len(message) + message)`
 *
 * @see https://eips.ethereum.org/EIPS/eip-191
 */

import { Keccak256, Secp256k1 } from "@tevm/voltaire";
const keccak256 = Keccak256.hash;
const secp256k1Sign = Secp256k1.sign;

/**
 * Hash a message with EIP-191 prefix
 *
 * @param {string | { raw: string | Uint8Array }} message - Message to hash
 * @returns {Uint8Array} 32-byte hash
 */
export function hashMessage(message) {
	const msgBytes = toMessageBytes(message);
	const prefix = new TextEncoder().encode(
		`\x19Ethereum Signed Message:\n${msgBytes.length}`,
	);
	const combined = new Uint8Array(prefix.length + msgBytes.length);
	combined.set(prefix);
	combined.set(msgBytes, prefix.length);
	return keccak256(combined);
}

/**
 * Convert message to bytes
 *
 * @param {string | { raw: string | Uint8Array }} message
 * @returns {Uint8Array}
 */
function toMessageBytes(message) {
	if (typeof message === "string") {
		return new TextEncoder().encode(message);
	}
	if (typeof message.raw === "string") {
		// Hex string - decode
		const hex = message.raw.startsWith("0x")
			? message.raw.slice(2)
			: message.raw;
		const bytes = new Uint8Array(hex.length / 2);
		for (let i = 0; i < bytes.length; i++) {
			bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
		}
		return bytes;
	}
	return message.raw;
}

/**
 * Serialize signature to 65-byte hex string
 *
 * @param {{ r: Uint8Array; s: Uint8Array; v: number }} signature
 * @returns {string} 0x-prefixed hex signature
 */
function serializeSignature(signature) {
	const bytes = new Uint8Array(65);
	bytes.set(signature.r, 0);
	bytes.set(signature.s, 32);
	bytes[64] = signature.v;
	return `0x${Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
}

/**
 * Sign a message using EIP-191 format
 *
 * @param {Object} params
 * @param {string | { raw: string | Uint8Array }} params.message - Message to sign
 * @param {Uint8Array} params.privateKey - 32-byte private key
 * @returns {Promise<string>} 65-byte hex signature
 *
 * @example
 * ```javascript
 * import { signMessage } from './signMessage.js';
 *
 * const signature = await signMessage({
 *   message: 'Hello, Ethereum!',
 *   privateKey: privateKeyBytes,
 * });
 * // '0x...' (130 hex chars)
 * ```
 */
export async function signMessage({ message, privateKey }) {
	const hash = hashMessage(message);
	const sig = secp256k1Sign(hash, privateKey);
	return serializeSignature(sig);
}

/**
 * Factory: Create signMessage with injected dependencies
 *
 * @param {Object} deps
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256
 * @param {(hash: Uint8Array, privateKey: Uint8Array) => { r: Uint8Array; s: Uint8Array; v: number }} deps.sign
 * @returns {(params: { message: string | { raw: string | Uint8Array }; privateKey: Uint8Array }) => Promise<string>}
 */
export function SignMessage({ keccak256: keccak256Fn, sign }) {
	return async function signMessage({ message, privateKey }) {
		const msgBytes = toMessageBytes(message);
		const prefix = new TextEncoder().encode(
			`\x19Ethereum Signed Message:\n${msgBytes.length}`,
		);
		const combined = new Uint8Array(prefix.length + msgBytes.length);
		combined.set(prefix);
		combined.set(msgBytes, prefix.length);
		const hash = keccak256Fn(combined);
		const sig = sign(hash, privateKey);
		return serializeSignature(sig);
	};
}
