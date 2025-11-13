import { Eip712Error } from "./errors.js";

/**
 * Factory: Recover Ethereum address from EIP-712 typed data signature.
 *
 * Uses ECDSA public key recovery to determine the signer's address.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(signature: Uint8Array, hash: Uint8Array, recoveryBit: number) => Uint8Array} deps.recoverPublicKey - Secp256k1 public key recovery function
 * @param {(typedData: import('./BrandedEIP712.js').TypedData) => import('../../primitives/Hash/index.js').BrandedHash} deps.hashTypedData - Hash typed data function
 * @returns {(signature: import('./BrandedEIP712.js').Signature, typedData: import('./BrandedEIP712.js').TypedData) => import('../../primitives/Address/index.js').BrandedAddress} Function that recovers address
 * @throws {Eip712Error} If signature recovery fails or public key format is invalid
 * @example
 * ```javascript
 * import { RecoverAddress } from './crypto/EIP712/recoverAddress.js';
 * import { hash as keccak256 } from '../Keccak256/hash.js';
 * import { recoverPublicKey } from '../Secp256k1/recoverPublicKey.js';
 * import { HashTypedData } from './hashTypedData.js';
 * const hashTypedData = HashTypedData({ keccak256, hashDomain, hashStruct });
 * const recoverAddress = RecoverAddress({ keccak256, recoverPublicKey, hashTypedData });
 * const address = recoverAddress(signature, typedData);
 * ```
 */
export function RecoverAddress({ keccak256, recoverPublicKey, hashTypedData }) {
	return function recoverAddress(signature, typedData) {
		const hash = hashTypedData(typedData);

		// Convert Ethereum v (27 or 28) to recovery bit (0 or 1)
		const recoveryBit = signature.v - 27;

		// Concatenate r and s for compact signature (64 bytes)
		const compactSig = new Uint8Array(64);
		compactSig.set(signature.r, 0);
		compactSig.set(signature.s, 32);

		// Recover public key (uncompressed 64 bytes)
		const uncompressedPubKey = recoverPublicKey(compactSig, hash, recoveryBit);

		// Validate public key length
		if (uncompressedPubKey.length !== 64) {
			throw new Eip712Error("Invalid recovered public key format", {
				code: "EIP712_INVALID_PUBLIC_KEY_FORMAT",
				context: { length: uncompressedPubKey.length, expected: 64 },
				docsPath: "/crypto/eip712/recover-address#error-handling",
			});
		}

		// Address is last 20 bytes of keccak256(publicKey)
		const pubKeyHash = keccak256(uncompressedPubKey);
		return /** @type {import('../../primitives/Address/index.js').BrandedAddress} */ (
			pubKeyHash.slice(-20)
		);
	};
}
