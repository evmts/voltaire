// @ts-nocheck
import { secp256k1 } from "@noble/curves/secp256k1.js";
import {
	CryptoError,
	InvalidPrivateKeyError,
} from "../../primitives/errors/index.js";
import { Hash } from "../../primitives/Hash/index.js";

/**
 * Sign a pre-hashed message with a private key
 *
 * This is the hash-level API that operates directly on a 32-byte hash.
 * Use this when you need custom hashing schemes or interop with other libraries.
 * For standard Ethereum signing, use sign() instead.
 *
 * Uses deterministic ECDSA (RFC 6979) for signature generation.
 * Returns signature with Ethereum-compatible v value (27 or 28).
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('../../primitives/Hash/index.js').HashType} hash - 32-byte hash to sign (pre-hashed message)
 * @param {import('../../primitives/PrivateKey/PrivateKeyType.js').PrivateKeyType} privateKey - 32-byte private key
 * @returns {import('./SignatureType.js').Secp256k1SignatureType} ECDSA signature with r, s, v components
 * @throws {InvalidPrivateKeyError} If private key is invalid
 * @throws {CryptoError} If signing fails or hash is not 32 bytes
 * @example
 * ```javascript
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 * import * as Hash from './primitives/Hash/index.js';
 * import * as PrivateKey from './primitives/PrivateKey/index.js';
 *
 * // Sign a pre-hashed message (hash-level API)
 * const hash = Hash.keccak256String('Hello!');
 * const privateKey = PrivateKey.from(new Uint8Array(32));
 * const signature = Secp256k1.signHash(hash, privateKey);
 *
 * // For comparison, sign() hashes internally (message-level API)
 * const signature2 = Secp256k1.sign(Hash.keccak256String('Hello!'), privateKey);
 * ```
 */
export function signHash(hash, privateKey) {
	// Validate hash is exactly 32 bytes
	if (hash.length !== 32) {
		throw new CryptoError(`Hash must be exactly 32 bytes, got ${hash.length}`, {
			code: "INVALID_HASH_LENGTH",
			context: { hashLength: hash.length, expected: 32 },
			docsPath: "/crypto/secp256k1/sign-hash#error-handling",
		});
	}

	// Validate private key is not zero
	const isZero = privateKey.every((byte) => byte === 0);
	if (isZero) {
		throw new InvalidPrivateKeyError("Private key cannot be zero", {
			code: "PRIVATE_KEY_ZERO",
			docsPath: "/crypto/secp256k1/sign-hash#error-handling",
		});
	}

	try {
		// Sign with compact format (prehash:false since we already have the hash)
		const sigCompact = secp256k1.sign(hash, privateKey, {
			prehash: false,
		});

		// Extract r and s
		const r = sigCompact.slice(0, 32);
		const s = sigCompact.slice(32, 64);

		// Compute recovery bit by trying all possibilities (0-3)
		// In practice, only 0-1 are typically needed for secp256k1
		const publicKey = secp256k1.getPublicKey(privateKey, false);
		const sig = secp256k1.Signature.fromBytes(sigCompact);

		let recoveryBit = 0;
		for (let i = 0; i < 4; i++) {
			try {
				const sigWithRecovery = sig.addRecoveryBit(i);
				const recovered = sigWithRecovery.recoverPublicKey(hash);
				const uncompressed = recovered.toBytes(false);

				if (uncompressed.every((byte, idx) => byte === publicKey[idx])) {
					recoveryBit = i;
					break;
				}
			} catch {
				// This recovery bit doesn't work, try next
			}
		}

		// Convert recovery bit to Ethereum v (27 or 28)
		const v = 27 + recoveryBit;

		return { r: Hash.from(r), s: Hash.from(s), v };
	} catch (error) {
		throw new CryptoError(`Signing failed: ${error}`, {
			code: "SECP256K1_SIGN_HASH_FAILED",
			context: { hashLength: hash.length, privateKeyLength: privateKey.length },
			docsPath: "/crypto/secp256k1/sign-hash#error-handling",
			cause: error,
		});
	}
}
