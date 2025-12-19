// @ts-nocheck
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { CryptoError } from "../../primitives/errors/index.js";
import { PUBLIC_KEY_SIZE } from "./constants.js";

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
 * Verify an ECDSA signature against a pre-hashed message
 *
 * This is the hash-level API that operates directly on a 32-byte hash.
 * Use this when you need custom hashing schemes or interop with other libraries.
 * For standard Ethereum signing, use verify() instead.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./SignatureType.js').Secp256k1SignatureType} signature - ECDSA signature with r, s, v components (r and s are HashType)
 * @param {import('../../primitives/Hash/index.js').HashType} hash - 32-byte hash that was signed (pre-hashed message)
 * @param {import('./Secp256k1PublicKeyType.js').Secp256k1PublicKeyType} publicKey - 64-byte uncompressed public key
 * @returns {boolean} true if signature is valid, false otherwise
 * @throws {CryptoError} If hash is not 32 bytes
 * @example
 * ```javascript
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 * import * as Hash from './primitives/Hash/index.js';
 *
 * // Verify a signature against a pre-hashed message (hash-level API)
 * const hash = Hash.keccak256String('Hello!');
 * const valid = Secp256k1.verifyHash({ r, s, v: 27 }, hash, publicKey);
 *
 * // For comparison, verify() hashes internally (message-level API)
 * const valid2 = Secp256k1.verify({ r, s, v: 27 }, messageHash, publicKey);
 * ```
 */
export function verifyHash(signature, hash, publicKey) {
	// Validate hash is exactly 32 bytes
	if (hash.length !== 32) {
		throw new CryptoError(`Hash must be exactly 32 bytes, got ${hash.length}`, {
			code: "INVALID_HASH_LENGTH",
			context: { hashLength: hash.length, expected: 32 },
			docsPath: "/crypto/secp256k1/verify-hash#error-handling",
		});
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

		const isValid = secp256k1.verify(compactSig, hash, prefixedPublicKey, {
			prehash: false,
		});

		if (!isValid) {
			return false;
		}

		// Verify that the v parameter correctly recovers to this public key
		// v=27 corresponds to recovery bit 0, v=28 corresponds to recovery bit 1
		const recoveryBit = signature.v - 27;
		const sig = secp256k1.Signature.fromBytes(compactSig);
		const sigWithRecovery = sig.addRecoveryBit(recoveryBit);
		const recovered = sigWithRecovery.recoverPublicKey(hash);
		const recoveredBytes = recovered.toBytes(false);

		// Compare with the provided public key (prefixed with 0x04)
		return recoveredBytes.every((byte, idx) => byte === prefixedPublicKey[idx]);
	} catch {
		return false;
	}
}
