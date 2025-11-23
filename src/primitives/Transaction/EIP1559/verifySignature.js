import { hash as keccak256 } from "../../../crypto/Keccak256/hash.js";
import { recoverPublicKey as secp256k1RecoverPublicKey, verify as secp256k1Verify } from "../../../crypto/Secp256k1/index.js";
import { Hash } from "../../Hash/index.js";
import { encode as rlpEncode } from "../../Rlp/encode.js";
import { GetSigningHash } from "./getSigningHash.js";

/**
 * Factory: Verify transaction signature.
 *
 * Verifies that the transaction signature is valid. This checks that:
 * 1. The signature components (r, s) are well-formed
 * 2. The yParity/v is valid
 * 3. A public key can be recovered from the signature
 * 4. The signature verifies against the recovered public key
 *
 * Note: This does NOT verify the transaction was signed by a specific address.
 * It only validates the signature is cryptographically valid and can recover
 * a sender address. To verify against an expected sender, use getSender() and
 * compare the result.
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(data: any[]) => Uint8Array} deps.rlpEncode - RLP encode function
 * @param {(sig: {r: Uint8Array, s: Uint8Array, v: number}, hash: Uint8Array) => Uint8Array} deps.secp256k1RecoverPublicKey - secp256k1 public key recovery
 * @param {(sig: {r: Uint8Array, s: Uint8Array, v: number}, hash: Uint8Array, publicKey: Uint8Array) => boolean} deps.secp256k1Verify - secp256k1 signature verification
 * @returns {(tx: import('./TransactionEIP1559Type.js').BrandedTransactionEIP1559) => boolean} Function that verifies signature
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @throws {never} Never throws - returns false on error
 * @example
 * ```javascript
 * import { VerifySignature } from './primitives/Transaction/EIP1559/verifySignature.js';
 * import { hash as keccak256 } from '../../../crypto/Keccak256/hash.js';
 * import { encode as rlpEncode } from '../../Rlp/encode.js';
 * import { recoverPublicKey, verify } from '../../../crypto/Secp256k1/index.js';
 * const verifySignature = VerifySignature({
 *   keccak256,
 *   rlpEncode,
 *   secp256k1RecoverPublicKey: recoverPublicKey,
 *   secp256k1Verify: verify
 * });
 * const isValid = verifySignature(tx);
 * ```
 */
export function VerifySignature({ keccak256, rlpEncode, secp256k1RecoverPublicKey, secp256k1Verify }) {
	const getSigningHash = GetSigningHash({ keccak256, rlpEncode });

	return function verifySignature(tx) {
		try {
			const signingHash = getSigningHash(tx);
			const v = 27 + tx.yParity;
			const r = Hash.from(tx.r);
			const s = Hash.from(tx.s);

			// Verify the signature cryptographically by recovering public key and verifying
			const publicKeyRecovered = secp256k1RecoverPublicKey({ r, s, v }, signingHash);
			return secp256k1Verify({ r, s, v }, signingHash, publicKeyRecovered);
		} catch {
			return false;
		}
	};
}

// Default export with crypto injected
export const verifySignature = VerifySignature({
	keccak256,
	rlpEncode,
	secp256k1RecoverPublicKey,
	secp256k1Verify,
});
