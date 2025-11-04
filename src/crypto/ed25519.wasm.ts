/**
 * WASM implementation of Ed25519 operations
 *
 * Provides Ed25519 digital signature operations
 * using WebAssembly for performance.
 */

import * as loader from "../wasm-loader/loader.js";

// ============================================================================
// Main Ed25519Wasm Namespace
// ============================================================================

export namespace Ed25519Wasm {
	// ==========================================================================
	// Core Types
	// ==========================================================================

	export type Signature = Uint8Array; // 64 bytes
	export type PublicKey = Uint8Array; // 32 bytes
	export type SecretKey = Uint8Array; // 64 bytes
	export type Seed = Uint8Array; // 32 bytes

	// ==========================================================================
	// Constants
	// ==========================================================================

	export const SECRET_KEY_SIZE = 64;
	export const PUBLIC_KEY_SIZE = 32;
	export const SIGNATURE_SIZE = 64;
	export const SEED_SIZE = 32;

	// ==========================================================================
	// Errors
	// ==========================================================================

	export class Ed25519Error extends Error {
		constructor(message: string) {
			super(message);
			this.name = "Ed25519Error";
		}
	}

	export class InvalidSignatureError extends Ed25519Error {
		constructor(message: string) {
			super(message);
			this.name = "InvalidSignatureError";
		}
	}

	export class InvalidPublicKeyError extends Ed25519Error {
		constructor(message: string) {
			super(message);
			this.name = "InvalidPublicKeyError";
		}
	}

	export class InvalidSecretKeyError extends Ed25519Error {
		constructor(message: string) {
			super(message);
			this.name = "InvalidSecretKeyError";
		}
	}

	export class InvalidSeedError extends Ed25519Error {
		constructor(message: string) {
			super(message);
			this.name = "InvalidSeedError";
		}
	}

	// ==========================================================================
	// Keypair Generation
	// ==========================================================================

	export function keypairFromSeed(seed: Seed): {
		secretKey: SecretKey;
		publicKey: PublicKey;
	} {
		if (seed.length !== SEED_SIZE) {
			throw new InvalidSeedError(
				`Seed must be ${SEED_SIZE} bytes, got ${seed.length}`,
			);
		}

		try {
			return loader.ed25519KeypairFromSeed(seed);
		} catch (error) {
			throw new Ed25519Error(`Keypair generation failed: ${error}`);
		}
	}

	// ==========================================================================
	// Signing Operations
	// ==========================================================================

	export function sign(message: Uint8Array, secretKey: SecretKey): Signature {
		if (secretKey.length !== SECRET_KEY_SIZE) {
			throw new InvalidSecretKeyError(
				`Secret key must be ${SECRET_KEY_SIZE} bytes, got ${secretKey.length}`,
			);
		}

		try {
			return loader.ed25519Sign(message, secretKey);
		} catch (error) {
			throw new Ed25519Error(`Signing failed: ${error}`);
		}
	}

	// ==========================================================================
	// Verification Operations
	// ==========================================================================

	export function verify(
		signature: Signature,
		message: Uint8Array,
		publicKey: PublicKey,
	): boolean {
		if (publicKey.length !== PUBLIC_KEY_SIZE) {
			throw new InvalidPublicKeyError(
				`Public key must be ${PUBLIC_KEY_SIZE} bytes, got ${publicKey.length}`,
			);
		}

		if (signature.length !== SIGNATURE_SIZE) {
			throw new InvalidSignatureError(
				`Signature must be ${SIGNATURE_SIZE} bytes, got ${signature.length}`,
			);
		}

		try {
			return loader.ed25519Verify(message, signature, publicKey);
		} catch {
			return false;
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
			return loader.ed25519DerivePublicKey(secretKey);
		} catch (error) {
			throw new InvalidSecretKeyError(`Failed to derive public key: ${error}`);
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

	export function validateSeed(seed: Seed): boolean {
		return seed.length === SEED_SIZE;
	}
}
