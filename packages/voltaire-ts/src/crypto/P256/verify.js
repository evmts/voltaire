// @ts-nocheck
import { p256 } from "@noble/curves/nist.js";
import { PUBLIC_KEY_SIZE } from "./constants.js";
import { InvalidPublicKeyError } from "./errors.js";

/**
 * Verify an ECDSA signature
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./P256SignatureType.js').P256SignatureType} signature - ECDSA signature to verify (r and s are HashType)
 * @param {import('../../primitives/Hash/index.js').HashType | import('../SHA256/SHA256HashType.js').SHA256Hash | Uint8Array} messageHash - 32-byte message hash that was signed (accepts HashType, SHA256Hash, or raw Uint8Array)
 * @param {import('./P256PublicKeyType.js').P256PublicKeyType} publicKey - 64-byte uncompressed public key
 * @returns {boolean} True if signature is valid, false otherwise
 * @throws {InvalidPublicKeyError} If public key format is invalid
 * @example
 * ```javascript
 * import * as P256 from './crypto/P256/index.js';
 * import * as SHA256 from './crypto/SHA256/index.js';
 *
 * // Using SHA256 hash (common for P256/ECDSA)
 * const messageHash = SHA256.hash(message);
 * const valid = P256.verify(signature, messageHash, publicKey);
 * ```
 */
export function verify(signature, messageHash, publicKey) {
	if (publicKey.length !== PUBLIC_KEY_SIZE) {
		throw new InvalidPublicKeyError(
			`Public key must be ${PUBLIC_KEY_SIZE} bytes, got ${publicKey.length}`,
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
