/**
 * X25519 synchronous native implementation using Zig C ABI (Bun FFI / Node-API).
 * Drop-in 1:1 replacement for pure JS X25519.
 */

import { constantTimeIsZero } from "../../crypto/ConstantTime/constantTimeIsZero.js";
import {
	PUBLIC_KEY_SIZE,
	SECRET_KEY_SIZE,
	SHARED_SECRET_SIZE,
} from "../../crypto/X25519/constants.js";
import {
	InvalidPublicKeyError,
	InvalidSecretKeyError,
	X25519Error,
} from "../../crypto/X25519/errors.js";
import { generateSecretKey } from "../../crypto/X25519/generateSecretKey.js";
import { isValidPublicKey } from "../../crypto/X25519/isValidPublicKey.js";
import { isWeakPublicKey } from "../../crypto/X25519/isWeakPublicKey.js";
import type { PublicKey } from "../../crypto/X25519/PublicKey.js";
import type { SecretKey } from "../../crypto/X25519/SecretKey.js";
import type { SharedSecret } from "../../crypto/X25519/SharedSecret.js";
import { validatePublicKey } from "../../crypto/X25519/validatePublicKey.js";
import { validateSecretKey } from "../../crypto/X25519/validateSecretKey.js";
import type { X25519 as X25519JS } from "../../crypto/X25519/X25519.js";
import {
	allocateOutput,
	loadNativeSync,
} from "../../native-loader/index.js";

/**
 * Derive 32-byte X25519 public key from 32-byte secret key via native Zig FFI.
 */
export function derivePublicKey(secretKey: SecretKey): PublicKey {
	if (secretKey.length !== SECRET_KEY_SIZE) {
		throw new InvalidSecretKeyError(
			`Secret key must be ${SECRET_KEY_SIZE} bytes, got ${secretKey.length}`,
		);
	}

	const lib = loadNativeSync();
	const outPub = allocateOutput(PUBLIC_KEY_SIZE);
	const code = lib.x25519DerivePublicKey(secretKey, outPub);
	if (code !== 0) {
		throw new InvalidSecretKeyError(
			`Native X25519 public key derivation failed (code ${code})`,
		);
	}
	return outPub as PublicKey;
}

/**
 * Compute 32-byte X25519 ECDH shared secret via native Zig FFI.
 */
export function scalarmult(
	secretKey: SecretKey,
	publicKey: PublicKey,
): SharedSecret {
	if (secretKey.length !== SECRET_KEY_SIZE) {
		throw new InvalidSecretKeyError(
			`Secret key must be ${SECRET_KEY_SIZE} bytes, got ${secretKey.length}`,
		);
	}
	if (publicKey.length !== PUBLIC_KEY_SIZE) {
		throw new InvalidPublicKeyError(
			`Public key must be ${PUBLIC_KEY_SIZE} bytes, got ${publicKey.length}`,
		);
	}
	if (isWeakPublicKey(publicKey)) {
		throw new InvalidPublicKeyError(
			"Public key is a low-order point (all-zero shared secret)",
		);
	}

	const lib = loadNativeSync();
	const outShared = allocateOutput(SHARED_SECRET_SIZE);
	const code = lib.x25519Scalarmult(secretKey, publicKey, outShared);
	if (code !== 0) {
		throw new InvalidPublicKeyError(
			`Native X25519 scalar multiplication rejected peer public key (code ${code})`,
		);
	}
	if (constantTimeIsZero(outShared)) {
		throw new InvalidPublicKeyError(
			"Shared secret is all zeros (low-order public key)",
		);
	}
	return outShared as SharedSecret;
}

/**
 * Generate deterministic X25519 keypair from 32-byte seed via native Zig FFI.
 */
export function keypairFromSeed(seed: Uint8Array): {
	secretKey: SecretKey;
	publicKey: PublicKey;
} {
	if (seed.length !== SECRET_KEY_SIZE) {
		throw new InvalidSecretKeyError(
			`Seed must be ${SECRET_KEY_SIZE} bytes, got ${seed.length}`,
		);
	}

	const lib = loadNativeSync();
	const outSecret = allocateOutput(SECRET_KEY_SIZE);
	const outPub = allocateOutput(PUBLIC_KEY_SIZE);
	const code = lib.x25519KeypairFromSeed(seed, outSecret, outPub);
	if (code !== 0) {
		throw new X25519Error(`Native X25519 keypair generation failed (code ${code})`);
	}
	return {
		secretKey: outSecret as SecretKey,
		publicKey: outPub as PublicKey,
	};
}

/**
 * Generate random X25519 keypair backed by native key derivation.
 */
export function generateKeypair(): {
	secretKey: SecretKey;
	publicKey: PublicKey;
} {
	const secretKey = generateSecretKey();
	const publicKey = derivePublicKey(secretKey);
	return { secretKey, publicKey };
}

export {
	generateSecretKey,
	isValidPublicKey,
	isWeakPublicKey,
	PUBLIC_KEY_SIZE,
	SECRET_KEY_SIZE,
	SHARED_SECRET_SIZE,
	validatePublicKey,
	validateSecretKey,
};

export const X25519 = {
	derivePublicKey,
	scalarmult,
	keypairFromSeed,
	generateSecretKey,
	generateKeypair,
	validateSecretKey,
	validatePublicKey,
	isValidPublicKey,
	isWeakPublicKey,
	SECRET_KEY_SIZE,
	PUBLIC_KEY_SIZE,
	SHARED_SECRET_SIZE,
} satisfies typeof X25519JS;
