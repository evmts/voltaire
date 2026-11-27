/**
 * Ed25519 synchronous native implementation using Zig C ABI (Bun FFI / Node-API).
 * Drop-in 1:1 replacement for pure JS Ed25519.
 */

import {
	PUBLIC_KEY_SIZE,
	SECRET_KEY_SIZE,
	SEED_SIZE,
	SIGNATURE_SIZE,
} from "../../crypto/Ed25519/constants.js";
import {
	Ed25519Error,
	InvalidPublicKeyError,
	InvalidSecretKeyError,
	InvalidSeedError,
	InvalidSignatureError,
} from "../../crypto/Ed25519/errors.js";
import { Ed25519 as Ed25519JS } from "../../crypto/Ed25519/index.js";
import { isValidPublicKey } from "../../crypto/Ed25519/isValidPublicKey.js";
import type { PublicKey } from "../../crypto/Ed25519/PublicKey.js";
import type { SecretKey } from "../../crypto/Ed25519/SecretKey.js";
import type { Seed } from "../../crypto/Ed25519/Seed.js";
import type { Signature } from "../../crypto/Ed25519/Signature.js";
import { validatePublicKey } from "../../crypto/Ed25519/validatePublicKey.js";
import { validateSecretKey } from "../../crypto/Ed25519/validateSecretKey.js";
import { validateSeed } from "../../crypto/Ed25519/validateSeed.js";
import {
	allocateOutput,
	loadNativeSync,
	safeBufferPtr,
} from "../../native-loader/index.js";

/**
 * Expand a 32-byte Ed25519 seed into the 64-byte `[seed || publicKey]` layout
 * required by Zig's hardened `ed25519Sign` / `ed25519DerivePublicKey` C ABI.
 */
function expandSecretKey(seed: Uint8Array): Uint8Array {
	const publicKey = Ed25519JS.derivePublicKey(seed as SecretKey);
	const expanded = new Uint8Array(64);
	expanded.set(seed, 0);
	expanded.set(publicKey, 32);
	return expanded;
}

/**
 * Sign a message with a 32-byte Ed25519 secret key (seed) via native Zig FFI.
 */
export function sign(message: Uint8Array, secretKey: SecretKey): Signature {
	if (secretKey.length !== SECRET_KEY_SIZE) {
		throw new InvalidSecretKeyError(
			`Secret key must be ${SECRET_KEY_SIZE} bytes, got ${secretKey.length}`,
		);
	}

	const expanded = expandSecretKey(secretKey);
	try {
		const lib = loadNativeSync();
		const outSig = allocateOutput(SIGNATURE_SIZE);
		const code = lib.ed25519Sign(
			safeBufferPtr(message),
			message.length,
			expanded,
			outSig,
		);
		if (code !== 0) {
			throw new Ed25519Error(`Native Ed25519 signing failed (code ${code})`);
		}
		return outSig as Signature;
	} finally {
		expanded.fill(0);
	}
}

/**
 * Verify a 64-byte Ed25519 signature over a message with a 32-byte public key via native Zig FFI.
 */
export function verify(
	signature: Signature,
	message: Uint8Array,
	publicKey: PublicKey,
): boolean {
	if (publicKey.length !== PUBLIC_KEY_SIZE) {
		throw new InvalidPublicKeyError(
			`Public key must be ${PUBLIC_KEY_SIZE} bytes, got ${publicKey.length}`,
			{
				code: -32602,
				context: { length: publicKey.length, expected: PUBLIC_KEY_SIZE },
				docsPath: "/crypto/ed25519/verify#error-handling",
			},
		);
	}
	if (signature.length !== SIGNATURE_SIZE) {
		throw new InvalidSignatureError(
			`Signature must be ${SIGNATURE_SIZE} bytes, got ${signature.length}`,
			{
				code: -32602,
				context: { length: signature.length, expected: SIGNATURE_SIZE },
				docsPath: "/crypto/ed25519/verify#error-handling",
			},
		);
	}

	const lib = loadNativeSync();
	// ed25519Verify returns 0 if valid, 1 if invalid, negative on non-canonical/weak key error
	return (
		lib.ed25519Verify(
			safeBufferPtr(message),
			message.length,
			signature,
			publicKey,
		) === 0
	);
}

/**
 * Derive 32-byte Ed25519 public key from 32-byte secret key (verified through native Zig FFI).
 */
export function derivePublicKey(secretKey: SecretKey): PublicKey {
	if (secretKey.length !== SECRET_KEY_SIZE) {
		throw new InvalidSecretKeyError(
			`Secret key must be ${SECRET_KEY_SIZE} bytes, got ${secretKey.length}`,
		);
	}

	const expanded = expandSecretKey(secretKey);
	try {
		const lib = loadNativeSync();
		const outPub = allocateOutput(PUBLIC_KEY_SIZE);
		const code = lib.ed25519DerivePublicKey(expanded, outPub);
		if (code !== 0) {
			throw new InvalidSecretKeyError(
				`Native Ed25519 key derivation failed (code ${code})`,
			);
		}
		return outPub as PublicKey;
	} finally {
		expanded.fill(0);
	}
}

/**
 * Generate Ed25519 keypair from 32-byte seed.
 */
export function keypairFromSeed(seed: Seed): {
	secretKey: SecretKey;
	publicKey: PublicKey;
} {
	if (seed.length !== SEED_SIZE) {
		throw new InvalidSeedError(
			`Seed must be ${SEED_SIZE} bytes, got ${seed.length}`,
			{
				code: -32602,
				context: { length: seed.length, expected: SEED_SIZE },
				docsPath: "/crypto/ed25519/keypair-from-seed#error-handling",
			},
		);
	}
	const publicKey = derivePublicKey(seed as unknown as SecretKey);
	return {
		secretKey: seed as unknown as SecretKey,
		publicKey,
	};
}

export {
	isValidPublicKey,
	PUBLIC_KEY_SIZE,
	SECRET_KEY_SIZE,
	SEED_SIZE,
	SIGNATURE_SIZE,
	validatePublicKey,
	validateSecretKey,
	validateSeed,
};

export const Ed25519 = {
	keypairFromSeed,
	sign,
	verify,
	derivePublicKey,
	validateSecretKey,
	validatePublicKey,
	isValidPublicKey,
	validateSeed,
	SECRET_KEY_SIZE,
	PUBLIC_KEY_SIZE,
	SIGNATURE_SIZE,
	SEED_SIZE,
} satisfies typeof Ed25519JS;
