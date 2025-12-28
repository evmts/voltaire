// @ts-nocheck
/**
 * BLS12-381 Aggregate Signature Verification
 *
 * Verify aggregated BLS signatures efficiently.
 * Uses "short signatures" scheme (Ethereum consensus).
 *
 * @see https://voltaire.tevm.sh/crypto/bls12-381 for BLS12-381 documentation
 * @since 0.0.0
 */

import { bls12_381 } from "@noble/curves/bls12-381.js";
import { SignatureError } from "./errors.js";

// Ethereum consensus uses "short signatures" scheme
const bls = bls12_381.shortSignatures;

/**
 * Verify an aggregated signature where all signers signed the same message
 *
 * This is the most common case in Ethereum consensus - multiple validators
 * sign the same block/attestation.
 *
 * @param {Uint8Array} aggregatedSignature - Aggregated signature (96 bytes)
 * @param {Uint8Array} message - The message that was signed by all parties
 * @param {Uint8Array[]} publicKeys - Public keys of all signers (48 bytes each)
 * @returns {boolean} True if the aggregated signature is valid
 * @example
 * ```javascript
 * import { Bls12381 } from './crypto/Bls12381/index.js';
 *
 * const message = new TextEncoder().encode('Block attestation');
 *
 * const pk1 = Bls12381.randomPrivateKey();
 * const pk2 = Bls12381.randomPrivateKey();
 * const pubKey1 = Bls12381.derivePublicKey(pk1);
 * const pubKey2 = Bls12381.derivePublicKey(pk2);
 *
 * const sig1 = Bls12381.sign(message, pk1);
 * const sig2 = Bls12381.sign(message, pk2);
 * const aggSig = Bls12381.aggregate([sig1, sig2]);
 *
 * const isValid = Bls12381.aggregateVerify(aggSig, message, [pubKey1, pubKey2]);
 * console.log(isValid); // true
 * ```
 */
export function aggregateVerify(aggregatedSignature, message, publicKeys) {
	// Validate inputs
	if (!(aggregatedSignature instanceof Uint8Array)) {
		throw new SignatureError("Aggregated signature must be Uint8Array");
	}
	if (!(message instanceof Uint8Array)) {
		throw new SignatureError("Message must be Uint8Array");
	}
	if (!Array.isArray(publicKeys) || publicKeys.length === 0) {
		throw new SignatureError("At least one public key required");
	}

	try {
		// Deserialize public keys from bytes
		const pkPoints = publicKeys.map((pk) => bls12_381.G2.Point.fromBytes(pk));
		// Aggregate all public keys first
		const aggPubKey = bls.aggregatePublicKeys(pkPoints);
		// Hash message to G1 curve point
		const msgPoint = bls.hash(message);
		// Deserialize signature
		const sig = bls.Signature.fromBytes(aggregatedSignature);
		// Verify signature against aggregated key
		return bls.verify(sig, msgPoint, aggPubKey);
	} catch (error) {
		return false;
	}
}

/**
 * Verify an aggregated signature where each signer signed a different message
 *
 * Uses multi-pairing verification: product of e(pk_i, H(msg_i)) == e(G1, aggSig)
 *
 * @param {Uint8Array} aggregatedSignature - Aggregated signature (96 bytes)
 * @param {Uint8Array[]} messages - Messages that were signed (one per signer)
 * @param {Uint8Array[]} publicKeys - Public keys (one per signer, same order as messages)
 * @returns {boolean} True if the aggregated signature is valid
 * @throws {SignatureError} If messages and publicKeys have different lengths
 * @example
 * ```javascript
 * import { Bls12381 } from './crypto/Bls12381/index.js';
 *
 * const pk1 = Bls12381.randomPrivateKey();
 * const pk2 = Bls12381.randomPrivateKey();
 * const pubKey1 = Bls12381.derivePublicKey(pk1);
 * const pubKey2 = Bls12381.derivePublicKey(pk2);
 *
 * const msg1 = new TextEncoder().encode('Message 1');
 * const msg2 = new TextEncoder().encode('Message 2');
 *
 * const sig1 = Bls12381.sign(msg1, pk1);
 * const sig2 = Bls12381.sign(msg2, pk2);
 * const aggSig = Bls12381.aggregate([sig1, sig2]);
 *
 * const isValid = Bls12381.batchVerify(aggSig, [msg1, msg2], [pubKey1, pubKey2]);
 * console.log(isValid); // true
 * ```
 */
export function batchVerify(aggregatedSignature, messages, publicKeys) {
	// Validate inputs
	if (!(aggregatedSignature instanceof Uint8Array)) {
		throw new SignatureError("Aggregated signature must be Uint8Array");
	}
	if (!Array.isArray(messages) || messages.length === 0) {
		throw new SignatureError("At least one message required");
	}
	if (!Array.isArray(publicKeys) || publicKeys.length === 0) {
		throw new SignatureError("At least one public key required");
	}
	if (messages.length !== publicKeys.length) {
		throw new SignatureError(
			"Number of messages must match number of public keys",
		);
	}

	try {
		// Deserialize signature
		const sig = bls.Signature.fromBytes(aggregatedSignature);
		// Build items array for verifyBatch
		const items = messages.map((msg, i) => ({
			message: bls.hash(msg),
			publicKey: bls12_381.G2.Point.fromBytes(publicKeys[i]),
		}));
		// noble provides verifyBatch for this use case
		return bls.verifyBatch(sig, items);
	} catch (error) {
		return false;
	}
}

/**
 * Fast aggregate verify (same message case)
 *
 * Optimized for the common case where all signers signed the same message.
 * This is faster than aggregateVerify when you already have the aggregated public key.
 *
 * @param {Uint8Array} aggregatedSignature - Aggregated signature (96 bytes)
 * @param {Uint8Array} message - The message that was signed
 * @param {Uint8Array} aggregatedPublicKey - Pre-computed aggregated public key (48 bytes)
 * @returns {boolean} True if valid
 */
export function fastAggregateVerify(
	aggregatedSignature,
	message,
	aggregatedPublicKey,
) {
	if (!(aggregatedSignature instanceof Uint8Array)) {
		throw new SignatureError("Aggregated signature must be Uint8Array");
	}
	if (!(message instanceof Uint8Array)) {
		throw new SignatureError("Message must be Uint8Array");
	}
	if (!(aggregatedPublicKey instanceof Uint8Array)) {
		throw new SignatureError("Aggregated public key must be Uint8Array");
	}

	try {
		// Deserialize signature
		const sig = bls.Signature.fromBytes(aggregatedSignature);
		// Hash message to curve point
		const msgPoint = bls.hash(message);
		// Deserialize public key
		const pk = bls12_381.G2.Point.fromBytes(aggregatedPublicKey);
		// Verify
		return bls.verify(sig, msgPoint, pk);
	} catch (error) {
		return false;
	}
}
