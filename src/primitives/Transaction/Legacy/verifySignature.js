import { hash as keccak256 } from "../../../crypto/Keccak256/hash.js";
import { recoverPublicKey as secp256k1RecoverPublicKey } from "../../../crypto/Secp256k1/index.js";
import { Hash } from "../../Hash/index.js";
import { encode as rlpEncode } from "../../Rlp/encode.js";
import { getChainId } from "./getChainId.js";
import { GetSigningHash } from "./getSigningHash.js";

/**
 * Factory: Verify transaction signature.
 *
 * Verifies that the transaction signature is valid. This checks that:
 * 1. The signature components (r, s) are well-formed
 * 2. The v value is valid (for pre-EIP-155 or EIP-155 format)
 * 3. A public key can be recovered from the signature
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
 * @returns {(this: import('./TransactionLegacyType.js').TransactionLegacyType) => boolean} Function that verifies signature
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @throws {never} Never throws - returns false on error
 * @example
 * ```javascript
 * import { VerifySignature } from './primitives/Transaction/Legacy/verifySignature.js';
 * import { hash as keccak256 } from '../../../crypto/Keccak256/hash.js';
 * import { encode as rlpEncode } from '../../Rlp/encode.js';
 * import { recoverPublicKey } from '../../../crypto/Secp256k1/index.js';
 * const verifySignature = VerifySignature({
 *   keccak256,
 *   rlpEncode,
 *   secp256k1RecoverPublicKey: recoverPublicKey
 * });
 * const isValid = verifySignature.call(tx);
 * ```
 */
export function VerifySignature({
	keccak256,
	rlpEncode,
	secp256k1RecoverPublicKey,
}) {
	const getSigningHash = GetSigningHash({ keccak256, rlpEncode });

	/**
	 * @this {import('./TransactionLegacyType.js').TransactionLegacyType}
	 * @returns {boolean}
	 */
	return function verifySignature() {
		try {
			const signingHash = getSigningHash.call(this);

			// Convert v to recovery bit (0 or 1) then to standard format (27 or 28)
			const chainId = getChainId.call(this);
			let v;
			if (chainId !== null) {
				// EIP-155: v = chainId * 2 + 35 + recoveryBit
				const recoveryBit = Number(this.v - chainId * 2n - 35n);
				v = recoveryBit + 27;
			} else {
				// Pre-EIP-155: v = 27 + recoveryBit
				v = Number(this.v);
			}

			// Create HashType for r and s
			const r = Hash.from(this.r);
			const s = Hash.from(this.s);

			// Attempt to recover public key - validates signature is well-formed
			// If recovery succeeds, the signature is valid for this transaction
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
