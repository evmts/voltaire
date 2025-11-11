import { sign as secp256k1Sign } from "../Secp256k1/sign.js";
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
	const hash = hashTypedData(typedData);

	// Use Secp256k1.sign which handles recovery bit calculation
	return secp256k1Sign(hash, privateKey);
}
