// @ts-nocheck
export * from "./errors.js";
export * from "./constants.js";

import {
	PUBLIC_KEY_SIZE,
	SECRET_KEY_SIZE,
	SEED_SIZE,
	SIGNATURE_SIZE,
} from "./constants.js";
import { derivePublicKey } from "./derivePublicKey.js";
import { keypairFromSeed } from "./keypairFromSeed.js";
import { sign } from "./sign.js";
import { validatePublicKey } from "./validatePublicKey.js";
import { validateSecretKey } from "./validateSecretKey.js";
import { validateSeed } from "./validateSeed.js";
import { verify } from "./verify.js";

// Export individual functions
export {
	keypairFromSeed,
	sign,
	verify,
	derivePublicKey,
	validateSecretKey,
	validatePublicKey,
	validateSeed,
};

/**
 * Ed25519 Digital Signature Algorithm
 *
 * Edwards-curve Digital Signature Algorithm (EdDSA) using Curve25519.
 * Fast, secure, and deterministic signatures without requiring a hash function.
 * Used in many modern protocols including SSH, TLS 1.3, and cryptocurrency.
 *
 * @example
 * ```typescript
 * import { Ed25519 } from './Ed25519/index.js';
 *
 * // Generate keypair from seed
 * const seed = new Uint8Array(32); // Random seed
 * const keypair = Ed25519.keypairFromSeed(seed);
 *
 * // Sign a message
 * const message = new TextEncoder().encode('Hello, world!');
 * const signature = Ed25519.sign(message, keypair.secretKey);
 *
 * // Verify signature
 * const valid = Ed25519.verify(signature, message, keypair.publicKey);
 * ```
 */
export const Ed25519 = {
	keypairFromSeed,
	sign,
	verify,
	derivePublicKey,
	validateSecretKey,
	validatePublicKey,
	validateSeed,
	SECRET_KEY_SIZE,
	PUBLIC_KEY_SIZE,
	SIGNATURE_SIZE,
	SEED_SIZE,
};
