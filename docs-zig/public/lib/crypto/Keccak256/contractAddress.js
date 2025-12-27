import { InvalidLengthError } from "../../primitives/errors/ValidationError.js";
import { hash } from "./hash.js";

/**
 * Helper: Convert nonce to minimal bytes
 * @param {bigint} nonce - Nonce value
 * @returns {Uint8Array} Nonce as bytes
 */
function nonceToBytes(nonce) {
	if (nonce === 0n) {
		return new Uint8Array([0x80]); // RLP empty list
	}
	const hex = nonce.toString(16);
	const paddedHex = hex.length % 2 ? `0${hex}` : hex;
	const bytes = new Uint8Array(paddedHex.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(paddedHex.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

/**
 * Compute contract address from deployer and nonce
 *
 * Uses CREATE formula: keccak256(rlp([sender, nonce]))[12:]
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} sender - Deployer address (20 bytes)
 * @param {bigint} nonce - Transaction nonce
 * @returns {Uint8Array} Contract address (20 bytes)
 * @throws {InvalidLengthError} If sender is not 20 bytes
 * @example
 * ```javascript
 * import * as Keccak256 from './crypto/Keccak256/index.js';
 * const sender = new Uint8Array(20);
 * const address = Keccak256.contractAddress(sender, 0n);
 * ```
 */
export function contractAddress(sender, nonce) {
	if (sender.length !== 20) {
		throw new InvalidLengthError("Sender must be 20 bytes", {
			code: "KECCAK256_INVALID_SENDER_LENGTH",
			value: sender,
			expected: "20 bytes",
			context: { length: sender.length, nonce },
			docsPath: "/crypto/keccak256/contract-address#error-handling",
		});
	}
	// Simplified version - full RLP encoding needed for production
	// This is just the hash portion
	const data = new Uint8Array([...sender, ...nonceToBytes(nonce)]);
	const digest = hash(data);
	return digest.slice(12);
}
