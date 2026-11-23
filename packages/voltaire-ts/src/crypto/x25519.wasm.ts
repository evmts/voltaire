/**
 * WASM implementation of X25519 operations
 *
 * Provides Curve25519 Diffie-Hellman key exchange
 * using WebAssembly for performance.
 */

import * as loader from "../wasm-loader/loader.js";
import { constantTimeIsZero } from "./ConstantTime/constantTimeIsZero.js";
import { isWeakPublicKey as isWeakX25519PublicKey } from "./X25519/isWeakPublicKey.js";
import { validatePublicKey as validateX25519PublicKey } from "./X25519/validatePublicKey.js";

// ============================================================================
// Main X25519Wasm Namespace
// ============================================================================

export namespace X25519Wasm {
	// ==========================================================================
	// Core Types
	// ==========================================================================

	export type SecretKey = Uint8Array; // 32 bytes
	export type PublicKey = Uint8Array; // 32 bytes
	export type SharedSecret = Uint8Array; // 32 bytes

	// ==========================================================================
	// Constants
	// ==========================================================================

	export const SECRET_KEY_SIZE = 32;
	export const PUBLIC_KEY_SIZE = 32;
	export const SHARED_SECRET_SIZE = 32;

	// ==========================================================================
	// Errors
	// ==========================================================================

	export class X25519Error extends Error {
		readonly _tag: string = "X25519Error";
		constructor(message: string) {
			super(message);
			this.name = "X25519Error";
		}
	}

	export class InvalidSecretKeyError extends X25519Error {
		override readonly _tag = "InvalidSecretKeyError" as const;
		constructor(message: string) {
			super(message);
			this.name = "InvalidSecretKeyError";
		}
	}

	export class InvalidPublicKeyError extends X25519Error {
		override readonly _tag = "InvalidPublicKeyError" as const;
		constructor(message: string) {
			super(message);
			this.name = "InvalidPublicKeyError";
		}
	}

	// ==========================================================================
	// Key Derivation
	// ==========================================================================

	export function derivePublicKey(secretKey: SecretKey): PublicKey {
		if (secretKey.length !== SECRET_KEY_SIZE) {
			throw new InvalidSecretKeyError(
				`Secret key must be ${SECRET_KEY_SIZE} bytes, got ${secretKey.length}`,
			);
		}

		try {
			return loader.x25519DerivePublicKey(secretKey);
		} catch (error) {
			throw new InvalidSecretKeyError(`Failed to derive public key: ${error}`);
		}
	}

	// ==========================================================================
	// Key Exchange Operations
	// ==========================================================================

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

		if (isWeakX25519PublicKey(publicKey)) {
			throw new InvalidPublicKeyError(
				"Public key is a low-order point (all-zero shared secret)",
			);
		}

		let shared: SharedSecret;
		try {
			shared = loader.x25519Scalarmult(secretKey, publicKey);
		} catch (error) {
			throw new X25519Error(`Scalar multiplication failed: ${error}`);
		}

		// RFC 7748 section 6.1: abort on an all-zero shared secret
		if (constantTimeIsZero(shared)) {
			throw new InvalidPublicKeyError(
				"Shared secret is all zeros (low-order public key)",
			);
		}

		return shared;
	}

	// ==========================================================================
	// Keypair Generation
	// ==========================================================================

	export function keypairFromSeed(seed: Uint8Array): {
		secretKey: SecretKey;
		publicKey: PublicKey;
	} {
		if (seed.length !== SECRET_KEY_SIZE) {
			throw new InvalidSecretKeyError(
				`Seed must be ${SECRET_KEY_SIZE} bytes, got ${seed.length}`,
			);
		}

		try {
			return loader.x25519KeypairFromSeed(seed);
		} catch (error) {
			throw new X25519Error(`Keypair generation failed: ${error}`);
		}
	}

	// ==========================================================================
	// Validation
	// ==========================================================================

	export function validateSecretKey(secretKey: SecretKey): boolean {
		return secretKey.length === SECRET_KEY_SIZE;
	}

	export function validatePublicKey(publicKey: PublicKey): boolean {
		return validateX25519PublicKey(publicKey);
	}

	export function isValidPublicKey(publicKey: PublicKey): boolean {
		return validateX25519PublicKey(publicKey);
	}

	export function isWeakPublicKey(publicKey: PublicKey): boolean {
		return isWeakX25519PublicKey(publicKey);
	}
}
