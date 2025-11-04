// @ts-nocheck
import { p256 } from "@noble/curves/nist.js";
import { InvalidPublicKeyError, InvalidSignatureError } from "./errors.js";
import { PUBLIC_KEY_SIZE, SIGNATURE_COMPONENT_SIZE } from "./constants.js";

/**
 * Verify an ECDSA signature
 *
 * @param {import('./BrandedP256Signature.js').BrandedP256Signature} signature - ECDSA signature to verify
 * @param {import('../../primitives/Hash/index.js').BrandedHash} messageHash - 32-byte message hash that was signed
 * @param {import('./BrandedP256PublicKey.js').BrandedP256PublicKey} publicKey - 64-byte uncompressed public key
 * @returns {boolean} True if signature is valid, false otherwise
 * @throws {InvalidPublicKeyError} If public key format is invalid
 * @throws {InvalidSignatureError} If signature format is invalid
 *
 * @example
 * ```typescript
 * const valid = P256.verify(signature, messageHash, publicKey);
 * if (valid) console.log('Signature is valid!');
 * ```
 */
export function verify(signature, messageHash, publicKey) {
	if (publicKey.length !== PUBLIC_KEY_SIZE) {
		throw new InvalidPublicKeyError(
			`Public key must be ${PUBLIC_KEY_SIZE} bytes, got ${publicKey.length}`,
		);
	}

	if (signature.r.length !== SIGNATURE_COMPONENT_SIZE) {
		throw new InvalidSignatureError(
			`Signature r must be ${SIGNATURE_COMPONENT_SIZE} bytes, got ${signature.r.length}`,
		);
	}

	if (signature.s.length !== SIGNATURE_COMPONENT_SIZE) {
		throw new InvalidSignatureError(
			`Signature s must be ${SIGNATURE_COMPONENT_SIZE} bytes, got ${signature.s.length}`,
		);
	}

	try {
		// Combine r and s into compact signature format
		const compactSig = new Uint8Array(64);
		compactSig.set(signature.r, 0);
		compactSig.set(signature.s, 32);

		// Add 0x04 prefix for uncompressed public key
		const fullPublicKey = new Uint8Array(65);
		fullPublicKey[0] = 0x04;
		fullPublicKey.set(publicKey, 1);

		return p256.verify(compactSig, messageHash, fullPublicKey);
	} catch {
		return false;
	}
}
