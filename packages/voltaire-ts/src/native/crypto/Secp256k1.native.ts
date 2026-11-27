/**
 * secp256k1 synchronous native implementation using Zig C ABI (Bun FFI / Node-API).
 * Drop-in 1:1 replacement for pure JS Secp256k1.
 */

import { constantTimeEqual } from "../../crypto/ConstantTime/constantTimeEqual.js";
import { constantTimeIsZero } from "../../crypto/ConstantTime/constantTimeIsZero.js";
import { addPoints } from "../../crypto/Secp256k1/addPoints.js";
import {
	CURVE_ORDER,
	PRIVATE_KEY_SIZE,
	PUBLIC_KEY_SIZE,
	SIGNATURE_COMPONENT_SIZE,
} from "../../crypto/Secp256k1/constants.js";
import { ecdh } from "../../crypto/Secp256k1/ecdh.js";
import {
	Secp256k1 as Secp256k1JS,
	Secp256k1Error,
} from "../../crypto/Secp256k1/index.js";
import { isValidPrivateKey } from "../../crypto/Secp256k1/isValidPrivateKey.js";
import { isValidPublicKey } from "../../crypto/Secp256k1/isValidPublicKey.js";
import * as PublicKeyMethods from "../../crypto/Secp256k1/PublicKey/index.js";
import type { Secp256k1PublicKeyType } from "../../crypto/Secp256k1/Secp256k1PublicKeyType.js";
import * as SignatureMethods from "../../crypto/Secp256k1/Signature/index.js";
import type { Secp256k1SignatureType } from "../../crypto/Secp256k1/SignatureType.js";
import { scalarMultiply } from "../../crypto/Secp256k1/scalarMultiply.js";
import {
	allocateOutput,
	loadNativeSync,
} from "../../native-loader/index.js";
import {
	CryptoError,
	InvalidPrivateKeyError,
	InvalidSignatureError,
} from "../../primitives/errors/index.js";
import { Hash, type HashType } from "../../primitives/Hash/index.js";
import * as PrivateKeyMethods from "../../primitives/PrivateKey/index.js";
import type { PrivateKeyType } from "../../primitives/PrivateKey/PrivateKeyType.js";

export interface SignOptions {
	extraEntropy?: Uint8Array | boolean;
}

function packCompactSig(r: Uint8Array, s: Uint8Array): Uint8Array {
	const compact = new Uint8Array(64);
	compact.set(r, 0);
	compact.set(s, 32);
	return compact;
}

function validateSignatureLengths(signature: {
	r: Uint8Array;
	s: Uint8Array;
}): void {
	if (signature.r.length !== SIGNATURE_COMPONENT_SIZE) {
		throw new InvalidSignatureError(
			`Signature r must be ${SIGNATURE_COMPONENT_SIZE} bytes, got ${signature.r.length}`,
			{
				code: "INVALID_SIGNATURE_R_LENGTH",
				docsPath: "/crypto/secp256k1/verify#error-handling",
			},
		);
	}
	if (signature.s.length !== SIGNATURE_COMPONENT_SIZE) {
		throw new InvalidSignatureError(
			`Signature s must be ${SIGNATURE_COMPONENT_SIZE} bytes, got ${signature.s.length}`,
			{
				code: "INVALID_SIGNATURE_S_LENGTH",
				docsPath: "/crypto/secp256k1/verify#error-handling",
			},
		);
	}
}

/**
 * Sign a 32-byte message hash with a 32-byte secp256k1 private key via native Zig FFI.
 */
export function sign(
	messageHash: HashType,
	privateKey: PrivateKeyType,
	options: SignOptions = {},
): Secp256k1SignatureType {
	if (privateKey.length !== PRIVATE_KEY_SIZE) {
		throw new InvalidPrivateKeyError("Private key must be 32 bytes", {
			code: "PRIVATE_KEY_INVALID_LENGTH",
			docsPath: "/crypto/secp256k1/sign#error-handling",
		});
	}
	if (constantTimeIsZero(privateKey)) {
		throw new InvalidPrivateKeyError("Private key cannot be zero", {
			code: "PRIVATE_KEY_ZERO",
			docsPath: "/crypto/secp256k1/sign#error-handling",
		});
	}
	if (options.extraEntropy !== undefined) {
		return Secp256k1JS.sign(messageHash, privateKey, options);
	}

	const lib = loadNativeSync();
	const sigBuf = allocateOutput(64);
	const recidBuf = allocateOutput(1);
	const code = lib.secp256k1Sign(messageHash, privateKey, sigBuf, recidBuf);
	if (code !== 0) {
		throw new CryptoError(`Native secp256k1 sign failed (code ${code})`, {
			code: "SECP256K1_SIGN_FAILED",
			context: { messageHash, privateKeyLength: privateKey.length },
			docsPath: "/crypto/secp256k1/sign#error-handling",
		});
	}

	return {
		r: Hash.from(sigBuf.slice(0, 32)),
		s: Hash.from(sigBuf.slice(32, 64)),
		v: 27 + (recidBuf[0] ?? 0),
	};
}

/**
 * Sign a pre-hashed 32-byte digest with a private key via native Zig FFI.
 */
export function signHash(
	hash: HashType,
	privateKey: PrivateKeyType,
): Secp256k1SignatureType {
	if (hash.length !== 32) {
		throw new CryptoError(`Hash must be exactly 32 bytes, got ${hash.length}`, {
			code: "INVALID_HASH_LENGTH",
			context: { hashLength: hash.length, expected: 32 },
			docsPath: "/crypto/secp256k1/sign-hash#error-handling",
		});
	}
	return sign(hash, privateKey);
}

/**
 * Verify an ECDSA signature against a 32-byte message hash and 64-byte uncompressed public key.
 */
export function verify(
	signature: Secp256k1SignatureType,
	messageHash: HashType,
	publicKey: Secp256k1PublicKeyType,
): boolean {
	if (publicKey.length !== PUBLIC_KEY_SIZE) {
		throw new InvalidSignatureError(
			`Public key must be ${PUBLIC_KEY_SIZE} bytes, got ${publicKey.length}`,
			{
				code: "INVALID_PUBLIC_KEY_LENGTH",
				docsPath: "/crypto/secp256k1/verify#error-handling",
			},
		);
	}
	validateSignatureLengths(signature);
	if (signature.v !== 27 && signature.v !== 28) {
		return false;
	}

	const lib = loadNativeSync();
	const compactSig = packCompactSig(signature.r, signature.s);
	if (lib.secp256k1Verify(messageHash, compactSig, publicKey) !== 1) {
		return false;
	}

	const recovered = allocateOutput(PUBLIC_KEY_SIZE);
	const recCode = lib.primitives_secp256k1_recover_pubkey(
		messageHash,
		signature.r,
		signature.s,
		signature.v,
		recovered,
	);
	if (recCode !== 0) {
		return false;
	}
	return constantTimeEqual(recovered, publicKey);
}

/**
 * Verify an ECDSA signature against a pre-hashed 32-byte digest.
 */
export function verifyHash(
	signature: Secp256k1SignatureType,
	hash: HashType,
	publicKey: Secp256k1PublicKeyType,
): boolean {
	if (hash.length !== 32) {
		throw new CryptoError(`Hash must be exactly 32 bytes, got ${hash.length}`, {
			code: "INVALID_HASH_LENGTH",
			context: { hashLength: hash.length, expected: 32 },
			docsPath: "/crypto/secp256k1/verify-hash#error-handling",
		});
	}
	if (publicKey.length !== PUBLIC_KEY_SIZE) {
		return false;
	}
	return verify(signature, hash, publicKey);
}

/**
 * Recover 64-byte uncompressed public key from signature and 32-byte message hash.
 */
export function recoverPublicKey(
	signature: { r: Uint8Array; s: Uint8Array; v: number },
	messageHash: HashType,
): Secp256k1PublicKeyType {
	validateSignatureLengths(signature);
	if (
		signature.v !== 0 &&
		signature.v !== 1 &&
		signature.v !== 27 &&
		signature.v !== 28
	) {
		throw new InvalidSignatureError(
			`Invalid v value: ${signature.v} (expected 0, 1, 27, or 28)`,
			{
				code: "INVALID_SIGNATURE_V",
				context: { v: signature.v, expected: [0, 1, 27, 28] },
				docsPath: "/crypto/secp256k1/recover-public-key#error-handling",
			},
		);
	}

	const lib = loadNativeSync();
	const outPubkey = allocateOutput(PUBLIC_KEY_SIZE);
	const code = lib.primitives_secp256k1_recover_pubkey(
		messageHash,
		signature.r,
		signature.s,
		signature.v,
		outPubkey,
	);
	if (code !== 0) {
		throw new InvalidSignatureError(
			`Public key recovery failed (native code ${code})`,
			{
				code: "PUBLIC_KEY_RECOVERY_FAILED",
				context: { signature, messageHash },
				docsPath: "/crypto/secp256k1/recover-public-key#error-handling",
			},
		);
	}
	return outPubkey as Secp256k1PublicKeyType;
}

/**
 * Recover 64-byte uncompressed public key from signature and pre-hashed 32-byte digest.
 */
export function recoverPublicKeyFromHash(
	signature: { r: Uint8Array; s: Uint8Array; v: number },
	hash: HashType,
): Secp256k1PublicKeyType {
	if (hash.length !== 32) {
		throw new CryptoError(`Hash must be exactly 32 bytes, got ${hash.length}`, {
			code: "INVALID_HASH_LENGTH",
			context: { hashLength: hash.length, expected: 32 },
			docsPath: "/crypto/secp256k1/recover-public-key-from-hash#error-handling",
		});
	}
	return recoverPublicKey(signature, hash);
}

/**
 * Derive 64-byte uncompressed public key from 32-byte private key via native Zig FFI.
 */
export function derivePublicKey(
	privateKey: PrivateKeyType,
): Secp256k1PublicKeyType {
	if (privateKey.length !== PRIVATE_KEY_SIZE) {
		throw new InvalidPrivateKeyError(
			`Private key must be ${PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`,
			{
				code: "INVALID_PRIVATE_KEY_LENGTH",
				docsPath: "/crypto/secp256k1/derive-public-key#error-handling",
			},
		);
	}

	const lib = loadNativeSync();
	const outPubkey = allocateOutput(PUBLIC_KEY_SIZE);
	const code = lib.primitives_secp256k1_pubkey_from_private(
		privateKey,
		outPubkey,
	);
	if (code !== 0) {
		throw new InvalidPrivateKeyError(
			`Failed to derive public key (native code ${code})`,
			{
				code: "SECP256K1_KEY_DERIVATION_FAILED",
				docsPath: "/crypto/secp256k1/derive-public-key#error-handling",
			},
		);
	}
	return outPubkey as Secp256k1PublicKeyType;
}

/**
 * Validate signature components (low-s, valid r/s bounds, valid v) via native Zig FFI.
 */
export function isValidSignature(signature: Secp256k1SignatureType): boolean {
	if (
		signature.r.length !== SIGNATURE_COMPONENT_SIZE ||
		signature.s.length !== SIGNATURE_COMPONENT_SIZE
	) {
		return false;
	}
	if (
		signature.v !== 0 &&
		signature.v !== 1 &&
		signature.v !== 27 &&
		signature.v !== 28
	) {
		return false;
	}
	const lib = loadNativeSync();
	return lib.primitives_secp256k1_validate_signature(signature.r, signature.s);
}

/**
 * Generate a cryptographically secure random 32-byte secp256k1 private key via native Zig FFI.
 */
export function randomPrivateKey(): Uint8Array {
	const lib = loadNativeSync();
	const outKey = allocateOutput(PRIVATE_KEY_SIZE);
	const code = lib.primitives_generate_private_key(outKey);
	if (code !== 0) {
		throw new Secp256k1Error(
			`Failed to generate random private key (native code ${code})`,
			{
				code: -32000,
				docsPath: "/crypto/secp256k1/random-private-key#error-handling",
			},
		);
	}
	return outKey;
}

/**
 * Generate a secp256k1 keypair using native Zig FFI.
 */
export function createKeyPair(): {
	privateKey: PrivateKeyType;
	publicKey: Secp256k1PublicKeyType;
} {
	const privateKey = randomPrivateKey() as PrivateKeyType;
	const publicKey = derivePublicKey(privateKey);
	return { privateKey, publicKey };
}

export const Signature = SignatureMethods;
export const PublicKey = PublicKeyMethods;
export const PrivateKey = PrivateKeyMethods;

export {
	addPoints,
	CURVE_ORDER,
	ecdh,
	ecdh as getSharedSecret,
	isValidPrivateKey,
	isValidPublicKey,
	PRIVATE_KEY_SIZE,
	PUBLIC_KEY_SIZE,
	SIGNATURE_COMPONENT_SIZE,
	scalarMultiply,
};

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
	getSharedSecret: ecdh,
	addPoints,
	scalarMultiply,
	Signature: SignatureMethods,
	PublicKey: PublicKeyMethods,
	PrivateKey: PrivateKeyMethods,
	CURVE_ORDER,
	PRIVATE_KEY_SIZE,
	PUBLIC_KEY_SIZE,
	SIGNATURE_COMPONENT_SIZE,
} satisfies typeof Secp256k1JS;
