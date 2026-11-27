/**
 * WASM implementation of P256 (secp256r1) operations
 *
 * Provides cryptographic operations for NIST P-256 curve
 * using WebAssembly for performance.
 */

import type { HashType } from "../primitives/Hash/HashType.js";
import * as loader from "../wasm-loader/loader.js";
import { WasmNotInitializedError } from "../wasm-loader/loader.js";
import { validatePrivateKey as validateP256PrivateKey } from "./P256/validatePrivateKey.js";
import { validatePublicKey as validateP256PublicKey } from "./P256/validatePublicKey.js";

// ============================================================================
// Main P256Wasm Namespace
// ============================================================================

export namespace P256Wasm {
	// ==========================================================================
	// Core Types
	// ==========================================================================

	export type Signature = {
		r: Uint8Array;
		s: Uint8Array;
	};

	export type PublicKey = Uint8Array;
	export type PrivateKey = Uint8Array;

	// ==========================================================================
	// Constants
	// ==========================================================================

	export const CURVE_ORDER =
		0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;
	export const PRIVATE_KEY_SIZE = 32;
	export const PUBLIC_KEY_SIZE = 64;
	export const SIGNATURE_COMPONENT_SIZE = 32;
	export const MESSAGE_HASH_SIZE = 32;
	export const SHARED_SECRET_SIZE = 32;

	// ==========================================================================
	// Errors
	// ==========================================================================

	export class P256Error extends Error {
		readonly _tag: string = "P256Error";
		constructor(message: string) {
			super(message);
			this.name = "P256Error";
		}
	}

	export class InvalidSignatureError extends P256Error {
		override readonly _tag = "InvalidSignatureError" as const;
		constructor(message: string) {
			super(message);
			this.name = "InvalidSignatureError";
		}
	}

	export class InvalidPublicKeyError extends P256Error {
		override readonly _tag = "InvalidPublicKeyError" as const;
		constructor(message: string) {
			super(message);
			this.name = "InvalidPublicKeyError";
		}
	}

	export class InvalidPrivateKeyError extends P256Error {
		override readonly _tag = "InvalidPrivateKeyError" as const;
		constructor(message: string) {
			super(message);
			this.name = "InvalidPrivateKeyError";
		}
	}

	// ==========================================================================
	// Signing Operations
	// ==========================================================================

	export function sign(
		messageHash: HashType,
		privateKey: PrivateKey,
	): Signature {
		if (messageHash.length !== MESSAGE_HASH_SIZE) {
			throw new P256Error(
				`Message hash must be ${MESSAGE_HASH_SIZE} bytes, got ${messageHash.length}`,
			);
		}

		if (privateKey.length !== PRIVATE_KEY_SIZE) {
			throw new InvalidPrivateKeyError(
				`Private key must be ${PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`,
			);
		}

		loader.ensureWasmLoaded();
		try {
			const result = loader.p256Sign(messageHash, privateKey);
			return {
				r: result.slice(0, 32),
				s: result.slice(32, 64),
			};
		} catch (error) {
			if (error instanceof WasmNotInitializedError) throw error;
			throw new P256Error(`Signing failed: ${error}`);
		}
	}

	// ==========================================================================
	// Verification Operations
	// ==========================================================================

	export function verify(
		signature: Signature,
		messageHash: HashType,
		publicKey: PublicKey,
	): boolean {
		if (messageHash.length !== MESSAGE_HASH_SIZE) {
			throw new P256Error(
				`Message hash must be ${MESSAGE_HASH_SIZE} bytes, got ${messageHash.length}`,
			);
		}

		if (publicKey.length !== PUBLIC_KEY_SIZE) {
			throw new InvalidPublicKeyError(
				`Public key must be ${PUBLIC_KEY_SIZE} bytes, got ${publicKey.length}`,
			);
		}

		if (signature.r.length !== SIGNATURE_COMPONENT_SIZE) {
			throw new InvalidSignatureError(
				`Signature r must be ${SIGNATURE_COMPONENT_SIZE} bytes, got ${signature.r.length}`,
			);
		}

		if (signature.s.length !== SIGNATURE_COMPONENT_SIZE) {
			throw new InvalidSignatureError(
				`Signature s must be ${SIGNATURE_COMPONENT_SIZE} bytes, got ${signature.s.length}`,
			);
		}

		// Validate signature components
		let r = 0n;
		for (let i = 0; i < 32; i++) {
			r = (r << 8n) | BigInt(signature.r[i] ?? 0);
		}

		let s = 0n;
		for (let i = 0; i < 32; i++) {
			s = (s << 8n) | BigInt(signature.s[i] ?? 0);
		}

		// Reject invalid ranges
		if (r === 0n || r >= CURVE_ORDER) return false;
		if (s === 0n || s >= CURVE_ORDER) return false;

		// A signature can never be valid under an invalid public key
		if (!validateP256PublicKey(publicKey)) return false;

		loader.ensureWasmLoaded();
		try {
			const sig = new Uint8Array(64);
			sig.set(signature.r, 0);
			sig.set(signature.s, 32);
			return loader.p256Verify(messageHash, sig, publicKey);
		} catch (error) {
			if (error instanceof WasmNotInitializedError) throw error;
			return false;
		}
	}

	// ==========================================================================
	// Key Derivation
	// ==========================================================================

	export function derivePublicKey(privateKey: PrivateKey): PublicKey {
		if (privateKey.length !== PRIVATE_KEY_SIZE) {
			throw new InvalidPrivateKeyError(
				`Private key must be ${PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`,
			);
		}

		// Validate private key is in valid range [1, n-1]
		if (!validatePrivateKey(privateKey)) {
			throw new InvalidPrivateKeyError("Private key must be in range [1, n-1]");
		}

		loader.ensureWasmLoaded();
		try {
			return loader.p256DerivePublicKey(privateKey);
		} catch (error) {
			if (error instanceof WasmNotInitializedError) throw error;
			throw new InvalidPrivateKeyError(`Failed to derive public key: ${error}`);
		}
	}

	// ==========================================================================
	// ECDH Operations
	// ==========================================================================

	export function ecdh(
		privateKey: PrivateKey,
		publicKey: PublicKey,
	): Uint8Array {
		if (privateKey.length !== PRIVATE_KEY_SIZE) {
			throw new InvalidPrivateKeyError(
				`Private key must be ${PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`,
			);
		}

		if (publicKey.length !== PUBLIC_KEY_SIZE) {
			throw new InvalidPublicKeyError(
				`Public key must be ${PUBLIC_KEY_SIZE} bytes, got ${publicKey.length}`,
			);
		}

		// Full public-key validation: blocks invalid-curve and infinity attacks
		if (!validateP256PublicKey(publicKey)) {
			throw new InvalidPublicKeyError(
				"Public key is not a valid point on the P256 curve",
			);
		}

		loader.ensureWasmLoaded();
		try {
			return loader.p256Ecdh(privateKey, publicKey);
		} catch (error) {
			if (error instanceof WasmNotInitializedError) throw error;
			throw new P256Error(`ECDH failed: ${error}`);
		}
	}

	// ==========================================================================
	// Validation
	// ==========================================================================

	export function validatePrivateKey(privateKey: PrivateKey): boolean {
		return validateP256PrivateKey(privateKey);
	}

	export function validatePublicKey(publicKey: PublicKey): boolean {
		return validateP256PublicKey(publicKey);
	}

	export function isValidPublicKey(publicKey: PublicKey): boolean {
		return validateP256PublicKey(publicKey);
	}
}
