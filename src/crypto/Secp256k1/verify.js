// @ts-nocheck
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { PUBLIC_KEY_SIZE, SIGNATURE_COMPONENT_SIZE } from "./constants.js";
import {
	InvalidPublicKeyError,
	InvalidSignatureError,
} from "../../primitives/errors/index.js";

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
 * @param {import('./BrandedSignature.js').BrandedSignature} signature - ECDSA signature with r, s, v components
 * @param {import('../../primitives/Hash/index.js').BrandedHash} messageHash - 32-byte message hash that was signed
 * @param {Uint8Array} publicKey - 64-byte uncompressed public key
 * @returns {boolean} true if signature is valid, false otherwise
 * @throws {InvalidPublicKeyError} If public key is invalid
 * @throws {InvalidSignatureError} If signature format is invalid
 * @example
 * ```javascript
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 * const valid = Secp256k1.verify(signature, messageHash, publicKey);
 * ```
 */
export function verify(signature, messageHash, publicKey) {
	if (publicKey.length !== PUBLIC_KEY_SIZE) {
		throw new InvalidPublicKeyError(
			`Public key must be ${PUBLIC_KEY_SIZE} bytes, got ${publicKey.length}`,
			{
				code: "INVALID_PUBLIC_KEY_LENGTH",
				context: {
					actualLength: publicKey.length,
					expectedLength: PUBLIC_KEY_SIZE,
				},
				docsPath: "/crypto/secp256k1/verify#error-handling",
			},
		);
	}

	if (signature.r.length !== SIGNATURE_COMPONENT_SIZE) {
		throw new InvalidSignatureError(
			`Signature r must be ${SIGNATURE_COMPONENT_SIZE} bytes, got ${signature.r.length}`,
			{
				code: "INVALID_SIGNATURE_R_LENGTH",
				context: {
					actualLength: signature.r.length,
					expectedLength: SIGNATURE_COMPONENT_SIZE,
				},
				docsPath: "/crypto/secp256k1/verify#error-handling",
			},
		);
	}

	if (signature.s.length !== SIGNATURE_COMPONENT_SIZE) {
		throw new InvalidSignatureError(
			`Signature s must be ${SIGNATURE_COMPONENT_SIZE} bytes, got ${signature.s.length}`,
			{
				code: "INVALID_SIGNATURE_S_LENGTH",
				context: {
					actualLength: signature.s.length,
					expectedLength: SIGNATURE_COMPONENT_SIZE,
				},
				docsPath: "/crypto/secp256k1/verify#error-handling",
			},
		);
	}

	try {
		// Create 64-byte compact signature (r || s)
		const compactSig = concat(signature.r, signature.s);

		// Add 0x04 prefix for uncompressed public key
		const prefixedPublicKey = new Uint8Array(PUBLIC_KEY_SIZE + 1);
		prefixedPublicKey[0] = 0x04;
		prefixedPublicKey.set(publicKey, 1);

		// Verify using noble/curves with prehash:false (we already have the hash)
		return secp256k1.verify(compactSig, messageHash, prefixedPublicKey, {
			prehash: false,
		});
	} catch {
		return false;
	}
}
