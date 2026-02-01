import { Hash } from "./hash.js";

/**
 * Factory: Create signature verification function for EIP-191 personal messages
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(signature: {r: Uint8Array, s: Uint8Array, v: number}, messageHash: Uint8Array) => Uint8Array} deps.recoverPublicKey - secp256k1 public key recovery
 * @param {(x: bigint, y: bigint) => import("../Address/AddressType.js").AddressType} deps.addressFromPublicKey - Address derivation from public key
 * @returns {(message: Uint8Array | string, signature: {r: Uint8Array, s: Uint8Array, v: number}, expectedAddress: import("../Address/AddressType.js").AddressType) => boolean}
 */
export function Verify({ keccak256, recoverPublicKey, addressFromPublicKey }) {
	const hash = Hash({ keccak256 });

	/**
	 * Verify EIP-191 personal message signature
	 *
	 * Hashes the message with EIP-191 personal message format, recovers the
	 * signer's address from the signature, and compares with expected address.
	 *
	 * @param {Uint8Array | string} message - Message that was signed
	 * @param {Object} signature - ECDSA signature components
	 * @param {Uint8Array} signature.r - 32-byte r component
	 * @param {Uint8Array} signature.s - 32-byte s component
	 * @param {number} signature.v - Recovery id (0, 1, 27, or 28)
	 * @param {import("../Address/AddressType.js").AddressType} expectedAddress - Expected signer address
	 * @returns {boolean} True if signature is valid and from expected address
	 *
	 * @example
	 * ```javascript
	 * import { Verify } from './primitives/SignedData/verify.js';
	 * import { hash as keccak256 } from './crypto/Keccak256/hash.js';
	 * import { recoverPublicKey } from './crypto/Secp256k1/recoverPublicKey.js';
	 * import { fromPublicKey } from './primitives/Address/fromPublicKey.js';
	 *
	 * const verify = Verify({
	 *   keccak256,
	 *   recoverPublicKey,
	 *   addressFromPublicKey: fromPublicKey
	 * });
	 *
	 * const isValid = verify('Hello, Ethereum!', signature, signerAddress);
	 * ```
	 */
	return function verify(message, signature, expectedAddress) {
		try {
			// Hash message with EIP-191 format
			const messageHash = hash(message);

			// Recover public key from signature
			const publicKey = recoverPublicKey(signature, messageHash);

			// Derive address from public key (64 bytes: 32-byte x, 32-byte y)
			let x = 0n;
			let y = 0n;
			for (let i = 0; i < 32; i++) {
				const xByte = publicKey[i];
				const yByte = publicKey[32 + i];
				if (xByte !== undefined && yByte !== undefined) {
					x = (x << 8n) | BigInt(xByte);
					y = (y << 8n) | BigInt(yByte);
				}
			}
			const recoveredAddress = addressFromPublicKey(x, y);

			// Compare addresses
			if (recoveredAddress.length !== expectedAddress.length) {
				return false;
			}
			for (let i = 0; i < recoveredAddress.length; i++) {
				if (recoveredAddress[i] !== expectedAddress[i]) {
					return false;
				}
			}
			return true;
		} catch (_error) {
			// Recovery or verification failed
			return false;
		}
	};
}
