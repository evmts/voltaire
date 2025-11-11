/**
 * Ed25519 operations implementation
 *
 * Uses @noble/curves Ed25519 implementation since WASM exports
 * are not yet available in Zig 0.15.1 (API changed).
 */

import { ed25519 } from "@noble/curves/ed25519.js";

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
			const publicKey = ed25519.getPublicKey(seed);
			// Ed25519 secret key is 64 bytes: seed (32) + public key (32)
			const secretKey = new Uint8Array(64);
			secretKey.set(seed, 0);
			secretKey.set(publicKey, 32);
			return { secretKey, publicKey };
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
			// Use first 32 bytes as seed for signing
			const seed = secretKey.slice(0, 32);
			return ed25519.sign(message, seed);
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
			return ed25519.verify(signature, message, publicKey);
		} catch {
			return false;
		}
	}

	// ==========================================================================
	// Key Derivation
	// ==========================================================================

	export function derivePublicKey(secretKey: SecretKey): PublicKey {
		// Allow both 32-byte seed and 64-byte secret key
		if (secretKey.length === SEED_SIZE) {
			// Treat as seed, derive public key
			try {
				return ed25519.getPublicKey(secretKey);
			} catch (error) {
				throw new InvalidSecretKeyError(`Failed to derive public key: ${error}`);
			}
		}

		if (secretKey.length !== SECRET_KEY_SIZE) {
			throw new InvalidSecretKeyError(
				`Secret key must be ${SECRET_KEY_SIZE} bytes, got ${secretKey.length}`,
			);
		}

		try {
			// Public key is stored in last 32 bytes of 64-byte secret key
			return secretKey.slice(32, 64);
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
