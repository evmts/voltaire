import { secp256k1 } from "@noble/curves/secp256k1.js";
import { Eip712Error } from "./errors.js";
import { hashTypedData } from "./hashTypedData.js";

/**
 * Sign EIP-712 typed data with ECDSA private key.
 *
 * Produces a signature that can be verified against the signer's address.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./BrandedEIP712.js').TypedData} typedData - Typed data to sign
 * @param {Uint8Array} privateKey - 32-byte secp256k1 private key
 * @returns {import('./BrandedEIP712.js').Signature} ECDSA signature with r, s, v components
 * @throws {Eip712Error} If private key length is invalid or signing fails
 * @example
 * ```javascript
 * import * as EIP712 from './crypto/EIP712/index.js';
 * const privateKey = new Uint8Array(32); // Your private key
 * const signature = EIP712.signTypedData(typedData, privateKey);
 * ```
 */
export function signTypedData(typedData, privateKey) {
	if (privateKey.length !== 32) {
		throw new Eip712Error("Private key must be 32 bytes", {
			code: "EIP712_INVALID_PRIVATE_KEY_LENGTH",
			context: { length: privateKey.length, expected: 32 },
			docsPath: "/crypto/eip712/sign-typed-data#error-handling",
		});
	}

	const hash = hashTypedData(typedData);
	// console.log("[signTypedData] hash:", Buffer.from(hash).toString('hex'));

	// Sign with prehash:false (we already have the hash) and format:'recovered' to get recovery bit
	const sigBytes = secp256k1.sign(hash, privateKey, {
		prehash: false,
		format: "recovered",
	});

	// sigBytes is 65 bytes: r (32) || s (32) || recovery_byte (1)
	const r = sigBytes.slice(0, 32);
	const s = sigBytes.slice(32, 64);

	// Convert recovery byte to Ethereum v (27 or 28)
	const recoveryByte = sigBytes[64];
	if (recoveryByte === undefined) {
		throw new Eip712Error("Invalid signature: missing recovery byte", {
			code: "EIP712_MISSING_RECOVERY_BYTE",
			context: { signatureLength: sigBytes.length },
			docsPath: "/crypto/eip712/sign-typed-data#error-handling",
		});
	}
	const v = 27 + (recoveryByte & 1);

	return { r, s, v };
}
