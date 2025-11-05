// @ts-nocheck
/**
 * P256 (secp256r1) Cryptography
 *
 * Complete ECDSA signing and verification using the NIST P-256 elliptic curve.
 * Also known as secp256r1 or prime256v1.
 * Used for WebAuthn, iOS Secure Enclave, and modern cryptographic applications.
 *
 * @example
 * ```typescript
 * import { P256 } from './P256.js';
 * import { Hash } from '../../primitives/Hash/index.js';
 *
 * // Sign a message hash
 * const messageHash = Hash.keccak256String('Hello!');
 * const privateKey = new Uint8Array(32); // Your private key
 * const signature = P256.sign(messageHash, privateKey);
 *
 * // Verify signature
 * const publicKey = P256.derivePublicKey(privateKey);
 * const valid = P256.verify(signature, messageHash, publicKey);
 *
 * // ECDH key exchange
 * const sharedSecret = P256.ecdh(privateKey, publicKey);
 * ```
 */

export * from "./errors.js";
export * from "./constants.js";
export * from "./BrandedP256Signature.js";
export * from "./BrandedP256PublicKey.js";
export * from "./BrandedP256PrivateKey.js";

import {
	CURVE_ORDER,
	PRIVATE_KEY_SIZE,
	PUBLIC_KEY_SIZE,
	SHARED_SECRET_SIZE,
	SIGNATURE_COMPONENT_SIZE,
} from "./constants.js";
import { derivePublicKey } from "./derivePublicKey.js";
import { ecdh } from "./ecdh.js";
import { sign } from "./sign.js";
import { validatePrivateKey } from "./validatePrivateKey.js";
import { validatePublicKey } from "./validatePublicKey.js";
import { verify } from "./verify.js";

// Export individual functions
export {
	sign,
	verify,
	derivePublicKey,
	ecdh,
	validatePrivateKey,
	validatePublicKey,
};

/**
 * @typedef {import('./P256Constructor.js').P256Constructor} P256Constructor
 */

/**
 * P256 namespace with cryptographic operations
 *
 * @type {P256Constructor}
 */
export const P256 = {
	sign,
	verify,
	derivePublicKey,
	ecdh,
	validatePrivateKey,
	validatePublicKey,
	CURVE_ORDER,
	PRIVATE_KEY_SIZE,
	PUBLIC_KEY_SIZE,
	SIGNATURE_COMPONENT_SIZE,
	SHARED_SECRET_SIZE,
};
