// @ts-nocheck
/**
 * BLS12-381 Signature Aggregation
 *
 * Aggregate multiple BLS signatures into a single signature.
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
 * Aggregate multiple BLS signatures into one
 *
 * The aggregated signature can be verified against an aggregated public key
 * (when all signers signed the same message) or via batch verification
 * (when signers signed different messages).
 *
 * @param {Uint8Array[]} signatures - Array of compressed G1 signatures (48 bytes each)
 * @returns {Uint8Array} Aggregated signature (48 bytes compressed G1)
 * @throws {SignatureError} If aggregation fails or no signatures provided
 * @example
 * ```javascript
 * import { Bls12381 } from './crypto/Bls12381/index.js';
 *
 * const message = new TextEncoder().encode('Vote for proposal');
 *
 * const pk1 = Bls12381.randomPrivateKey();
 * const pk2 = Bls12381.randomPrivateKey();
 *
 * const sig1 = Bls12381.sign(message, pk1);
 * const sig2 = Bls12381.sign(message, pk2);
 *
 * const aggSig = Bls12381.aggregate([sig1, sig2]);
 * ```
 */
export function aggregate(signatures) {
	if (!Array.isArray(signatures) || signatures.length === 0) {
		throw new SignatureError("At least one signature required for aggregation");
	}

	// Validate all inputs are Uint8Arrays
	for (let i = 0; i < signatures.length; i++) {
		if (!(signatures[i] instanceof Uint8Array)) {
			throw new SignatureError(`Signature at index ${i} must be Uint8Array`);
		}
	}

	try {
		// Deserialize each signature from bytes
		const sigPoints = signatures.map((sig) => bls.Signature.fromBytes(sig));
		// Aggregate
		const aggSig = bls.aggregateSignatures(sigPoints);
		// Return as bytes
		return aggSig.toBytes();
	} catch (error) {
		throw new SignatureError(`Signature aggregation failed: ${error.message}`);
	}
}

/**
 * Aggregate multiple public keys into one
 *
 * Used when multiple signers sign the same message and you want
 * to verify against a single aggregated public key.
 *
 * @param {Uint8Array[]} publicKeys - Array of compressed G2 public keys (96 bytes each)
 * @returns {Uint8Array} Aggregated public key (96 bytes compressed G2)
 * @throws {SignatureError} If aggregation fails or no public keys provided
 * @example
 * ```javascript
 * import { Bls12381 } from './crypto/Bls12381/index.js';
 *
 * const pk1 = Bls12381.randomPrivateKey();
 * const pk2 = Bls12381.randomPrivateKey();
 *
 * const pubKey1 = Bls12381.derivePublicKey(pk1);
 * const pubKey2 = Bls12381.derivePublicKey(pk2);
 *
 * const aggPubKey = Bls12381.aggregatePublicKeys([pubKey1, pubKey2]);
 * ```
 */
export function aggregatePublicKeys(publicKeys) {
	if (!Array.isArray(publicKeys) || publicKeys.length === 0) {
		throw new SignatureError(
			"At least one public key required for aggregation",
		);
	}

	// Validate all inputs are Uint8Arrays
	for (let i = 0; i < publicKeys.length; i++) {
		if (!(publicKeys[i] instanceof Uint8Array)) {
			throw new SignatureError(`Public key at index ${i} must be Uint8Array`);
		}
	}

	try {
		// Deserialize each public key from bytes (G2 points)
		const pkPoints = publicKeys.map((pk) =>
			bls12_381.G2.Point.fromBytes(pk),
		);
		// Aggregate
		const aggPk = bls.aggregatePublicKeys(pkPoints);
		// Return as bytes
		return aggPk.toBytes();
	} catch (error) {
		throw new SignatureError(
			`Public key aggregation failed: ${error.message}`,
		);
	}
}
