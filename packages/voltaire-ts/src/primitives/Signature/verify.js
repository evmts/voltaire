// @ts-nocheck

import { verify as p256Verify } from "../../crypto/P256/verify.js";
import { verify as secp256k1Verify } from "../../crypto/Secp256k1/verify.js";
import { Hash } from "../Hash/index.js";
import { InvalidAlgorithmError } from "./errors.js";

/**
 * Verify signature against message hash and public key
 *
 * Dispatches to the appropriate crypto implementation based on signature algorithm.
 *
 * @param {import('./SignatureType.js').SignatureType} signature - Signature to verify
 * @param {Uint8Array} messageHash - 32-byte message hash that was signed
 * @param {Uint8Array} publicKey - Public key to verify against (64 bytes for ECDSA)
 * @returns {boolean} True if signature is valid, false otherwise
 * @throws {InvalidAlgorithmError} If algorithm is not supported
 *
 * @example
 * ```typescript
 * const isValid = Signature.verify(sig, messageHash, publicKey);
 * ```
 */
export function verify(signature, messageHash, publicKey) {
	const { algorithm, v } = signature;

	if (algorithm === "secp256k1") {
		// Extract r and s from the signature bytes (first 32 bytes = r, next 32 = s)
		const r = Hash.from(signature.slice(0, 32));
		const s = Hash.from(signature.slice(32, 64));
		return secp256k1Verify({ r, s, v: v ?? 27 }, messageHash, publicKey);
	}

	if (algorithm === "p256") {
		// Extract r and s from the signature bytes (need to wrap as HashType)
		const r = Hash.from(signature.slice(0, 32));
		const s = Hash.from(signature.slice(32, 64));
		return p256Verify({ r, s }, messageHash, publicKey);
	}

	if (algorithm === "ed25519") {
		throw new InvalidAlgorithmError(
			"Ed25519 signature verification not yet implemented",
			{
				value: algorithm,
				expected: "secp256k1 or p256",
				docsPath: "/primitives/signature/verify#error-handling",
			},
		);
	}

	throw new InvalidAlgorithmError(`Unknown signature algorithm: ${algorithm}`, {
		value: algorithm,
		expected: "secp256k1, p256, or ed25519",
		docsPath: "/primitives/signature/verify#error-handling",
	});
}
