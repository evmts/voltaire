// @ts-nocheck
export * from "./errors.js";
export * from "./constants.js";
export * from "./BrandedSignature.js";

import { sign } from "./sign.js";
import { verify } from "./verify.js";
import { recoverPublicKey } from "./recoverPublicKey.js";
import { derivePublicKey } from "./derivePublicKey.js";
import { isValidSignature } from "./isValidSignature.js";
import { isValidPublicKey } from "./isValidPublicKey.js";
import { isValidPrivateKey } from "./isValidPrivateKey.js";
import * as SignatureMethods from "./Signature/index.js";
import {
	CURVE_ORDER,
	PRIVATE_KEY_SIZE,
	PUBLIC_KEY_SIZE,
	SIGNATURE_COMPONENT_SIZE,
} from "./constants.js";

// Export individual functions
export {
	sign,
	verify,
	recoverPublicKey,
	derivePublicKey,
	isValidSignature,
	isValidPublicKey,
	isValidPrivateKey,
};

export const Signature = SignatureMethods;

/**
 * @typedef {import('./BrandedSignature.js').BrandedSignature} BrandedSignature
 */

/**
 * secp256k1/ECDSA Cryptography namespace
 *
 * Complete ECDSA signing and verification using the secp256k1 elliptic curve.
 * All operations use the audited @noble/curves library for security.
 * Full Ethereum compatibility with v = 27/28 recovery IDs.
 *
 * @example
 * ```typescript
 * import { Secp256k1 } from './Secp256k1.js';
 * import { Hash } from '../../primitives/Hash/index.js';
 *
 * // Sign a message hash
 * const messageHash = Hash.keccak256String('Hello, Ethereum!');
 * const privateKey = new Uint8Array(32); // Your private key
 * const signature = Secp256k1.sign(messageHash, privateKey);
 *
 * // Verify signature
 * const publicKey = Secp256k1.derivePublicKey(privateKey);
 * const valid = Secp256k1.verify(signature, messageHash, publicKey);
 *
 * // Recover public key from signature
 * const recovered = Secp256k1.recoverPublicKey(signature, messageHash);
 * ```
 */
export const Secp256k1 = {
	sign,
	verify,
	recoverPublicKey,
	derivePublicKey,
	isValidSignature,
	isValidPublicKey,
	isValidPrivateKey,
	Signature: SignatureMethods,
	CURVE_ORDER,
	PRIVATE_KEY_SIZE,
	PUBLIC_KEY_SIZE,
	SIGNATURE_COMPONENT_SIZE,
};
