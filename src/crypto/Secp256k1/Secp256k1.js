// @ts-nocheck
export * from "./constants.js";
export * from "./SignatureType.js";
export * from "./Secp256k1PublicKeyType.js";
export * from "./errors.js";

import * as PrivateKeyMethods from "../../primitives/PrivateKey/index.js";
import * as PublicKeyMethods from "./PublicKey/index.js";
import * as SignatureMethods from "./Signature/index.js";
import { addPoints } from "./addPoints.js";
import {
	CURVE_ORDER,
	PRIVATE_KEY_SIZE,
	PUBLIC_KEY_SIZE,
	SIGNATURE_COMPONENT_SIZE,
} from "./constants.js";
import { createKeyPair } from "./createKeyPair.js";
import { derivePublicKey } from "./derivePublicKey.js";
import { ecdh } from "./ecdh.js";
import { isValidPrivateKey } from "./isValidPrivateKey.js";
import { isValidPublicKey } from "./isValidPublicKey.js";
import { isValidSignature } from "./isValidSignature.js";
import { randomPrivateKey } from "./randomPrivateKey.js";
import { recoverPublicKey } from "./recoverPublicKey.js";
import { recoverPublicKeyFromHash } from "./recoverPublicKeyFromHash.js";
import { scalarMultiply } from "./scalarMultiply.js";
import { sign } from "./sign.js";
import { signHash } from "./signHash.js";
import { verify } from "./verify.js";
import { verifyHash } from "./verifyHash.js";

// Export individual functions
export {
	sign,
	signHash,
	verify,
	verifyHash,
	recoverPublicKey,
	recoverPublicKeyFromHash,
	derivePublicKey,
	isValidSignature,
	isValidPublicKey,
	isValidPrivateKey,
	randomPrivateKey,
	createKeyPair,
	ecdh,
	ecdh as getSharedSecret, // Alias for API compatibility
	addPoints,
	scalarMultiply,
};

export const Signature = SignatureMethods;
export const PublicKey = PublicKeyMethods;
export const PrivateKey = PrivateKeyMethods;

/**
 * @typedef {import('./SignatureType.js').Secp256k1SignatureType} Secp256k1SignatureType
 */

/**
 * secp256k1/ECDSA Cryptography namespace
 *
 * Complete ECDSA signing and verification using the secp256k1 elliptic curve.
 * All operations use the audited @noble/curves library for security.
 * Full Ethereum compatibility with v = 27/28 recovery IDs.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { Secp256k1 } from './crypto/Secp256k1/index.js';
 * import * as Hash from './primitives/Hash/index.js';
 *
 * // Sign a message hash
 * const messageHash = Hash.keccak256String('Hello, Ethereum!');
 * const privateKey = new Uint8Array(32);
 * const signature = Secp256k1.sign(messageHash, privateKey);
 *
 * // Verify signature
 * const publicKey = Secp256k1.derivePublicKey(privateKey);
 * const valid = Secp256k1.verify(signature, messageHash, publicKey);
 *
 * // Recover public key from signature
 * const recovered = Secp256k1.recoverPublicKey(signature, messageHash);
 *
 * // Hash-level API for interop with other libraries
 * const hash = Hash.keccak256String('Hello');
 * const hashSig = Secp256k1.signHash(hash, privateKey);
 * const hashValid = Secp256k1.verifyHash(hashSig, hash, publicKey);
 * ```
 */
export const Secp256k1 = {
	sign,
	signHash,
	verify,
	verifyHash,
	recoverPublicKey,
	recoverPublicKeyFromHash,
	derivePublicKey,
	isValidSignature,
	isValidPublicKey,
	isValidPrivateKey,
	randomPrivateKey,
	createKeyPair,
	ecdh,
	getSharedSecret: ecdh, // Alias for API compatibility
	addPoints,
	scalarMultiply,
	Signature: SignatureMethods,
	PublicKey: PublicKeyMethods,
	PrivateKey: PrivateKeyMethods,
	CURVE_ORDER,
	PRIVATE_KEY_SIZE,
	PUBLIC_KEY_SIZE,
	SIGNATURE_COMPONENT_SIZE,
};
