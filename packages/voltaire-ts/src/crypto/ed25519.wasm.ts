/**
 * WASM implementation of Ed25519 digital signatures.
 *
 * Uses Zig's audited std.crypto Ed25519 implementation via WebAssembly
 * (`ed25519Sign`, `ed25519Verify`, `ed25519DerivePublicKey`).
 */

import { ed25519 } from "@noble/curves/ed25519.js";
import * as loader from "../wasm-loader/loader.js";
import { WasmNotInitializedError } from "../wasm-loader/loader.js";
import { validatePublicKey as validateEd25519PublicKey } from "./Ed25519/validatePublicKey.js";

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
		readonly _tag: string = "Ed25519Error";
		constructor(message: string) {
			super(message);
			this.name = "Ed25519Error";
		}
	}

	export class InvalidSignatureError extends Ed25519Error {
		override readonly _tag = "InvalidSignatureError" as const;
		constructor(message: string) {
			super(message);
			this.name = "InvalidSignatureError";
		}
	}

	export class InvalidPublicKeyError extends Ed25519Error {
		override readonly _tag = "InvalidPublicKeyError" as const;
		constructor(message: string) {
			super(message);
			this.name = "InvalidPublicKeyError";
		}
	}

	export class InvalidSecretKeyError extends Ed25519Error {
		override readonly _tag = "InvalidSecretKeyError" as const;
		constructor(message: string) {
			super(message);
			this.name = "InvalidSecretKeyError";
		}
	}

	export class InvalidSeedError extends Ed25519Error {
		override readonly _tag = "InvalidSeedError" as const;
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

		loader.ensureWasmLoaded();
		try {
			const derivedPub = ed25519.getPublicKey(seed);
			// Ed25519 secret key is 64 bytes: seed (32) + public key (32)
			const secretKey = new Uint8Array(64);
			secretKey.set(seed, 0);
			secretKey.set(derivedPub, 32);
			// Verify and derive final public key through Zig WASM
			const publicKey = loader.ed25519DerivePublicKey(secretKey);
			return { secretKey, publicKey };
		} catch (error) {
			if (error instanceof WasmNotInitializedError) throw error;
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

		loader.ensureWasmLoaded();
		try {
			return loader.ed25519Sign(message, secretKey);
		} catch (error) {
			if (error instanceof WasmNotInitializedError) throw error;
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

		loader.ensureWasmLoaded();
		try {
			return loader.ed25519Verify(message, signature, publicKey);
		} catch (error) {
			if (error instanceof WasmNotInitializedError) throw error;
			return false;
		}
	}

	// ==========================================================================
	// Key Derivation
	// ==========================================================================

	export function derivePublicKey(secretKey: SecretKey): PublicKey {
		// Allow both 32-byte seed and 64-byte secret key
		if (secretKey.length === SEED_SIZE) {
			loader.ensureWasmLoaded();
			try {
				const derivedPub = ed25519.getPublicKey(secretKey);
				const expanded = new Uint8Array(64);
				expanded.set(secretKey, 0);
				expanded.set(derivedPub, 32);
				try {
					return loader.ed25519DerivePublicKey(expanded);
				} finally {
					expanded.fill(0);
				}
			} catch (error) {
				if (error instanceof WasmNotInitializedError) throw error;
				throw new InvalidSecretKeyError(
					`Failed to derive public key: ${error}`,
				);
			}
		}

		if (secretKey.length !== SECRET_KEY_SIZE) {
			throw new InvalidSecretKeyError(
				`Secret key must be ${SECRET_KEY_SIZE} bytes, got ${secretKey.length}`,
			);
		}

		loader.ensureWasmLoaded();
		try {
			return loader.ed25519DerivePublicKey(secretKey);
		} catch (error) {
			if (error instanceof WasmNotInitializedError) throw error;
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
		return validateEd25519PublicKey(publicKey);
	}

	export function isValidPublicKey(publicKey: PublicKey): boolean {
		return validateEd25519PublicKey(publicKey);
	}

	export function validateSeed(seed: Seed): boolean {
		return seed.length === SEED_SIZE;
	}
}
