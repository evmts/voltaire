// @ts-nocheck
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { equalsConstantTime } from "../../primitives/Bytes/equalsConstantTime.js";
import { InvalidSignatureError } from "../../primitives/errors/index.js";
import { PUBLIC_KEY_SIZE, SIGNATURE_COMPONENT_SIZE } from "./constants.js";

/**
 * Concatenate multiple Uint8Arrays
 * @param {...Uint8Array} arrays
 * @returns {Uint8Array}
 */
function concat(...arrays) {
	const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
	const result = new Uint8Array(totalLength);
	let offset = 0;
	for (const arr of arrays) {
		result.set(arr, offset);
		offset += arr.length;
	}
	return result;
}

/**
 * Verify an ECDSA signature
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./SignatureType.js').Secp256k1SignatureType} signature - ECDSA signature with r, s, v components (r and s are HashType)
 * @param {import('../../primitives/Hash/index.js').HashType} messageHash - 32-byte message hash that was signed
 * @param {import('./Secp256k1PublicKeyType.js').Secp256k1PublicKeyType} publicKey - 64-byte uncompressed public key
 * @returns {boolean} true if signature is valid, false otherwise
 * @throws {InvalidSignatureError} If signature v is invalid
 * @example
 * ```javascript
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 * import * as Hash from './primitives/Hash/index.js';
 * const r = Hash.from(rBytes);
 * const s = Hash.from(sBytes);
 * const valid = Secp256k1.verify({ r, s, v: 27 }, messageHash, publicKey);
 * ```
 */
export function verify(signature, messageHash, publicKey) {
	// Validate public key length
	if (publicKey.length !== PUBLIC_KEY_SIZE) {
		throw new InvalidSignatureError(
			`Public key must be ${PUBLIC_KEY_SIZE} bytes, got ${publicKey.length}`,
			{
				code: "INVALID_PUBLIC_KEY_LENGTH",
				docsPath: "/crypto/secp256k1/verify#error-handling",
			},
		);
	}
	// Validate signature component lengths
	if (signature.r.length !== SIGNATURE_COMPONENT_SIZE) {
		throw new InvalidSignatureError(
			`Signature r must be ${SIGNATURE_COMPONENT_SIZE} bytes, got ${signature.r.length}`,
			{
				code: "INVALID_SIGNATURE_R_LENGTH",
				docsPath: "/crypto/secp256k1/verify#error-handling",
			},
		);
	}
	if (signature.s.length !== SIGNATURE_COMPONENT_SIZE) {
		throw new InvalidSignatureError(
			`Signature s must be ${SIGNATURE_COMPONENT_SIZE} bytes, got ${signature.s.length}`,
			{
				code: "INVALID_SIGNATURE_S_LENGTH",
				docsPath: "/crypto/secp256k1/verify#error-handling",
			},
		);
	}
	// Validate v parameter (must be 27 or 28)
	if (signature.v !== 27 && signature.v !== 28) {
		return false;
	}

	try {
		// Create 64-byte compact signature (r || s)
		const compactSig = concat(signature.r, signature.s);

		// First verify the basic signature is valid
		const prefixedPublicKey = new Uint8Array(PUBLIC_KEY_SIZE + 1);
		prefixedPublicKey[0] = 0x04;
		prefixedPublicKey.set(publicKey, 1);

		const isValid = secp256k1.verify(
			compactSig,
			messageHash,
			prefixedPublicKey,
			{
				prehash: false,
			},
		);

		if (!isValid) {
			return false;
		}

		// Verify that the v parameter correctly recovers to this public key
		// v=27 corresponds to recovery bit 0, v=28 corresponds to recovery bit 1
		const recoveryBit = signature.v - 27;
		const sig = secp256k1.Signature.fromBytes(compactSig);
		const sigWithRecovery = sig.addRecoveryBit(recoveryBit);
		const recovered = sigWithRecovery.recoverPublicKey(messageHash);
		const recoveredBytes = recovered.toBytes(false);

		// Compare with the provided public key (prefixed with 0x04) using constant-time comparison
		return equalsConstantTime(recoveredBytes, prefixedPublicKey);
	} catch {
		return false;
	}
}
