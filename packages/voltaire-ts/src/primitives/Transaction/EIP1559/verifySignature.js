import { hash as keccak256 } from "../../../crypto/Keccak256/hash.js";
import { recoverPublicKey as secp256k1RecoverPublicKey } from "../../../crypto/Secp256k1/index.js";
import { Hash } from "../../Hash/index.js";
import { encode as rlpEncode } from "../../Rlp/encode.js";
import { GetSigningHash } from "./getSigningHash.js";

const SECP256K1_N =
	0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
const SECP256K1_HALF_N = SECP256K1_N / 2n;

/**
 * Factory: Verify transaction signature.
 *
 * Verifies that the transaction signature is valid. This checks that:
 * 1. The signature components (r, s) are well-formed
 * 2. The yParity/v is valid
 * 3. A public key can be recovered from the signature
 *
 * Note: This does NOT verify the transaction was signed by a specific address.
 * It only validates the signature is cryptographically valid and can recover
 * a sender address. To verify against an expected sender, use getSender() and
 * compare the result.
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(data: import('../../Rlp/encode.js').Encodable) => Uint8Array} deps.rlpEncode - RLP encode function
 * @param {*} deps.secp256k1RecoverPublicKey - secp256k1 public key recovery
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
 * import { recoverPublicKey } from '../../../crypto/Secp256k1/index.js';
 * const verifySignature = VerifySignature({
 *   keccak256,
 *   rlpEncode,
 *   secp256k1RecoverPublicKey: recoverPublicKey
 * });
 * const isValid = verifySignature(tx);
 * ```
 */
export function VerifySignature({
	keccak256,
	rlpEncode,
	secp256k1RecoverPublicKey,
}) {
	const getSigningHash = GetSigningHash({ keccak256, rlpEncode });

	return function verifySignature(tx) {
		try {
			const signingHash = getSigningHash(tx);
			const v = 27 + tx.yParity;
			const sBytes = tx.s;
			// EIP-2: Reject high-s signatures to prevent malleability
			const sValue = BigInt(
				`0x${Array.from(sBytes)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);
			if (sValue > SECP256K1_HALF_N) {
				return false;
			}

			const r = Hash.from(tx.r);
			const s = Hash.from(sBytes);

			// Attempt to recover public key - validates signature is well-formed
			secp256k1RecoverPublicKey({ r, s, v }, signingHash);
			return true;
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
});
