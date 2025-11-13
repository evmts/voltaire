import { hash as keccak256 } from "../../../crypto/Keccak256/hash.js";
import { encode as rlpEncode } from "../../Rlp/BrandedRlp/encode.js";
import { recoverPublicKey as secp256k1RecoverPublicKey, verify as secp256k1Verify } from "../../../crypto/Secp256k1/index.js";
import { Hash } from "../../Hash/index.js";
import { GetSigningHash } from "./getSigningHash.js";

/**
 * Factory: Verify transaction signature.
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(data: any[]) => Uint8Array} deps.rlpEncode - RLP encode function
 * @param {(sig: {r: Uint8Array, s: Uint8Array, v: number}, hash: Uint8Array) => Uint8Array} deps.secp256k1RecoverPublicKey - secp256k1 public key recovery
 * @param {(sig: {r: Uint8Array, s: Uint8Array, v: number}, hash: Uint8Array, publicKey: Uint8Array) => boolean} deps.secp256k1Verify - secp256k1 signature verification
 * @returns {(tx: import('./BrandedTransactionEIP4844.js').BrandedTransactionEIP4844) => boolean} Function that verifies signature
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @throws {never} Never throws - returns false on error
 * @example
 * ```javascript
 * import { VerifySignature } from './primitives/Transaction/EIP4844/verifySignature.js';
 * import { hash as keccak256 } from '../../../crypto/Keccak256/hash.js';
 * import { encode as rlpEncode } from '../../Rlp/BrandedRlp/encode.js';
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
export function VerifySignature({
	keccak256,
	rlpEncode,
	secp256k1RecoverPublicKey,
	secp256k1Verify,
}) {
	const getSigningHash = GetSigningHash({ keccak256, rlpEncode });

	return function verifySignature(tx) {
		try {
			const signingHash = getSigningHash(tx);
			const v = 27 + tx.yParity;
			const r = Hash.from(tx.r);
			const s = Hash.from(tx.s);
			const publicKey = secp256k1RecoverPublicKey({ r, s, v }, signingHash);
			return secp256k1Verify({ r, s, v }, signingHash, publicKey);
		} catch {
			return false;
		}
	};
}

// Default export with crypto injected
export const verifySignature = VerifySignature({ keccak256, rlpEncode, secp256k1RecoverPublicKey, secp256k1Verify });
