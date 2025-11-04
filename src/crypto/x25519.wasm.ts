/**
 * WASM implementation of X25519 operations
 *
 * Provides Curve25519 Diffie-Hellman key exchange
 * using WebAssembly for performance.
 */

import * as loader from "../wasm-loader/loader.js";

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
		constructor(message: string) {
			super(message);
			this.name = "X25519Error";
		}
	}

	export class InvalidSecretKeyError extends X25519Error {
		constructor(message: string) {
			super(message);
			this.name = "InvalidSecretKeyError";
		}
	}

	export class InvalidPublicKeyError extends X25519Error {
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

		try {
			return loader.x25519Scalarmult(secretKey, publicKey);
		} catch (error) {
			throw new X25519Error(`Scalar multiplication failed: ${error}`);
		}
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
		if (publicKey.length !== PUBLIC_KEY_SIZE) {
			return false;
		}
		// Basic check - should not be all zeros
		return publicKey.some((b) => b !== 0);
	}
}
