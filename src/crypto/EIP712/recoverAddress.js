import { secp256k1 } from "@noble/curves/secp256k1.js";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { Eip712Error } from "./errors.js";
import { hashTypedData } from "./hashTypedData.js";

/**
 * Recover Ethereum address from EIP-712 typed data signature.
 *
 * Uses ECDSA public key recovery to determine the signer's address.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./BrandedEIP712.js').Signature} signature - ECDSA signature with r, s, v components
 * @param {import('./BrandedEIP712.js').TypedData} typedData - Typed data that was signed
 * @returns {import('../../primitives/Address/index.js').BrandedAddress} 20-byte recovered Ethereum address
 * @throws {Eip712Error} If signature recovery fails or public key format is invalid
 * @example
 * ```javascript
 * import * as EIP712 from './crypto/EIP712/index.js';
 * const address = EIP712.recoverAddress(signature, typedData);
 * console.log('Signer:', address);
 * ```
 */
export function recoverAddress(signature, typedData) {
	const hash = hashTypedData(typedData);
	// console.log("[recoverAddress] hash:", Buffer.from(hash).toString('hex'));

	// Convert Ethereum v (27 or 28) to recovery bit (0 or 1)
	const recoveryBit = signature.v - 27;

	// Concatenate r and s for compact signature (64 bytes)
	const compactSig = new Uint8Array(64);
	compactSig.set(signature.r, 0);
	compactSig.set(signature.s, 32);

	// Recover public key point using fromBytes which expects 64-byte compact format
	const point = secp256k1.Signature.fromBytes(compactSig)
		.addRecoveryBit(recoveryBit)
		.recoverPublicKey(hash);

	// Convert point to uncompressed format (remove 0x04 prefix)
	const uncompressedWithPrefix = point.toBytes(false);
	if (uncompressedWithPrefix[0] !== 0x04) {
		throw new Eip712Error("Invalid recovered public key format", {
			code: "EIP712_INVALID_PUBLIC_KEY_FORMAT",
			context: { prefix: uncompressedWithPrefix[0], expected: 0x04 },
			docsPath: "/crypto/eip712/recover-address#error-handling",
		});
	}
	const uncompressedPubKey = uncompressedWithPrefix.slice(1);

	// Address is last 20 bytes of keccak256(publicKey)
	const pubKeyHash = keccak_256(uncompressedPubKey);
	return /** @type {import('../../primitives/Address/index.js').BrandedAddress} */ (
		pubKeyHash.slice(-20)
	);
}
