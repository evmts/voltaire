/**
 * Ed25519 Digital Signature Algorithm
 *
 * Edwards-curve Digital Signature Algorithm (EdDSA) using Curve25519.
 * Fast, secure, and deterministic signatures without requiring a hash function.
 * Used in many modern protocols including SSH, TLS 1.3, and cryptocurrency.
 *
 * @example
 * ```typescript
 * import { Ed25519 } from './ed25519.js';
 *
 * // Generate keypair from seed
 * const seed = new Uint8Array(32); // Random seed
 * const keypair = Ed25519.keypairFromSeed(seed);
 *
 * // Sign a message
 * const message = new TextEncoder().encode('Hello, world!');
 * const signature = Ed25519.sign(message, keypair.secretKey);
 *
 * // Verify signature
 * const valid = Ed25519.verify(signature, message, keypair.publicKey);
 * ```
 */

import { ed25519 } from "@noble/curves/ed25519.js";

// ============================================================================
// Error Types
// ============================================================================

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

// ============================================================================
// Main Ed25519 Namespace
// ============================================================================

export namespace Ed25519 {
	// ==========================================================================
	// Core Types
	// ==========================================================================

	/**
	 * Ed25519 signature (64 bytes)
	 */
	export type Signature = Uint8Array;

	/**
	 * Ed25519 public key (32 bytes)
	 */
	export type PublicKey = Uint8Array;

	/**
	 * Ed25519 secret key (32 bytes)
	 * Note: Some implementations use 64-byte secret keys (32 seed + 32 prefix),
	 * but @noble/curves uses 32-byte seeds
	 */
	export type SecretKey = Uint8Array;

	/**
	 * Seed for deterministic keypair generation (32 bytes)
	 */
	export type Seed = Uint8Array;

	// ==========================================================================
	// Constants
	// ==========================================================================

	/**
	 * Secret key size in bytes (seed size)
	 */
	export const SECRET_KEY_SIZE = 32;

	/**
	 * Public key size in bytes
	 */
	export const PUBLIC_KEY_SIZE = 32;

	/**
	 * Signature size in bytes
	 */
	export const SIGNATURE_SIZE = 64;

	/**
	 * Seed size in bytes
	 */
	export const SEED_SIZE = 32;

	// ==========================================================================
	// Keypair Generation
	// ==========================================================================

	/**
	 * Generate Ed25519 keypair from seed
	 *
	 * @param seed - 32-byte seed for deterministic generation
	 * @returns Object with secretKey and publicKey
	 * @throws {InvalidSeedError} If seed length is invalid
	 *
	 * @example
	 * ```typescript
	 * const seed = crypto.getRandomValues(new Uint8Array(32));
	 * const keypair = Ed25519.keypairFromSeed(seed);
	 * ```
	 */
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
			return {
				secretKey: seed,
				publicKey,
			};
		} catch (error) {
			throw new Ed25519Error(`Keypair generation failed: ${error}`);
		}
	}

	// ==========================================================================
	// Signing Operations
	// ==========================================================================

	/**
	 * Sign a message with Ed25519 secret key
	 *
	 * @param message - Message to sign (any length)
	 * @param secretKey - 32-byte secret key (seed)
	 * @returns 64-byte signature
	 * @throws {InvalidSecretKeyError} If secret key is invalid
	 *
	 * @example
	 * ```typescript
	 * const message = new TextEncoder().encode('Hello!');
	 * const signature = Ed25519.sign(message, secretKey);
	 * ```
	 */
	export function sign(message: Uint8Array, secretKey: SecretKey): Signature {
		if (secretKey.length !== SECRET_KEY_SIZE) {
			throw new InvalidSecretKeyError(
				`Secret key must be ${SECRET_KEY_SIZE} bytes, got ${secretKey.length}`,
			);
		}

		try {
			return ed25519.sign(message, secretKey);
		} catch (error) {
			throw new Ed25519Error(`Signing failed: ${error}`);
		}
	}

	// ==========================================================================
	// Verification Operations
	// ==========================================================================

	/**
	 * Verify an Ed25519 signature
	 *
	 * @param signature - 64-byte signature to verify
	 * @param message - Original message that was signed
	 * @param publicKey - 32-byte public key
	 * @returns True if signature is valid, false otherwise
	 * @throws {InvalidPublicKeyError} If public key format is invalid
	 * @throws {InvalidSignatureError} If signature format is invalid
	 *
	 * @example
	 * ```typescript
	 * const valid = Ed25519.verify(signature, message, publicKey);
	 * if (valid) console.log('Signature is valid!');
	 * ```
	 */
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

	/**
	 * Derive public key from secret key
	 *
	 * @param secretKey - 32-byte secret key (seed)
	 * @returns 32-byte public key
	 * @throws {InvalidSecretKeyError} If secret key is invalid
	 *
	 * @example
	 * ```typescript
	 * const publicKey = Ed25519.derivePublicKey(secretKey);
	 * ```
	 */
	export function derivePublicKey(secretKey: SecretKey): PublicKey {
		if (secretKey.length !== SECRET_KEY_SIZE) {
			throw new InvalidSecretKeyError(
				`Secret key must be ${SECRET_KEY_SIZE} bytes, got ${secretKey.length}`,
			);
		}

		try {
			return ed25519.getPublicKey(secretKey);
		} catch (error) {
			throw new InvalidSecretKeyError(`Failed to derive public key: ${error}`);
		}
	}

	// ==========================================================================
	// Validation
	// ==========================================================================

	/**
	 * Validate a secret key
	 *
	 * Checks if the secret key has correct length
	 *
	 * @param secretKey - Secret key to validate
	 * @returns True if valid, false otherwise
	 */
	export function validateSecretKey(secretKey: SecretKey): boolean {
		if (secretKey.length !== SECRET_KEY_SIZE) {
			return false;
		}

		try {
			// Try to derive public key - will fail if invalid
			ed25519.getPublicKey(secretKey);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Validate a public key
	 *
	 * Checks if the public key is valid
	 *
	 * @param publicKey - Public key to validate
	 * @returns True if valid, false otherwise
	 */
	export function validatePublicKey(publicKey: PublicKey): boolean {
		if (publicKey.length !== PUBLIC_KEY_SIZE) {
			return false;
		}

		try {
			// Try to verify with a dummy signature - will fail if invalid key
			const dummySig = new Uint8Array(64);
			const dummyMsg = new Uint8Array(1);
			ed25519.verify(dummySig, dummyMsg, publicKey);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Validate a seed
	 *
	 * Checks if seed has correct length
	 *
	 * @param seed - Seed to validate
	 * @returns True if valid, false otherwise
	 */
	export function validateSeed(seed: Seed): boolean {
		return seed.length === SEED_SIZE;
	}
}
