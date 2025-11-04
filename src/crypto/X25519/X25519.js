// @ts-nocheck
export * from "./errors.js";
export * from "./constants.js";

import { derivePublicKey } from "./derivePublicKey.js";
import { scalarmult } from "./scalarmult.js";
import { keypairFromSeed } from "./keypairFromSeed.js";
import { generateSecretKey } from "./generateSecretKey.js";
import { generateKeypair } from "./generateKeypair.js";
import { validateSecretKey } from "./validateSecretKey.js";
import { validatePublicKey } from "./validatePublicKey.js";
import {
	SECRET_KEY_SIZE,
	PUBLIC_KEY_SIZE,
	SHARED_SECRET_SIZE,
} from "./constants.js";

// Export individual functions
export {
	derivePublicKey,
	scalarmult,
	keypairFromSeed,
	generateSecretKey,
	generateKeypair,
	validateSecretKey,
	validatePublicKey,
};

/**
 * X25519 Elliptic Curve Diffie-Hellman
 *
 * Curve25519 key exchange algorithm for secure shared secret generation.
 * Fast, simple, and designed for ECDH key agreement.
 * Used in modern protocols like TLS 1.3, WireGuard, Signal, and SSH.
 *
 * @example
 * ```typescript
 * import { X25519 } from './X25519.js';
 *
 * // Generate two keypairs
 * const seed1 = crypto.getRandomValues(new Uint8Array(32));
 * const seed2 = crypto.getRandomValues(new Uint8Array(32));
 * const keypair1 = X25519.keypairFromSeed(seed1);
 * const keypair2 = X25519.keypairFromSeed(seed2);
 *
 * // Perform key exchange
 * const shared1 = X25519.scalarmult(keypair1.secretKey, keypair2.publicKey);
 * const shared2 = X25519.scalarmult(keypair2.secretKey, keypair1.publicKey);
 * // shared1 === shared2 (same shared secret from both sides)
 * ```
 */
export const X25519 = {
	derivePublicKey,
	scalarmult,
	keypairFromSeed,
	generateSecretKey,
	generateKeypair,
	validateSecretKey,
	validatePublicKey,
	SECRET_KEY_SIZE,
	PUBLIC_KEY_SIZE,
	SHARED_SECRET_SIZE,
};
