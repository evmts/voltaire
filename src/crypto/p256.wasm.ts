/**
 * WASM implementation of P256 (secp256r1) operations
 *
 * Provides cryptographic operations for NIST P-256 curve
 * using WebAssembly for performance.
 */

import type { Hash } from "../primitives/Hash/index.js";
import * as loader from "../wasm-loader/loader.js";

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
	export const SHARED_SECRET_SIZE = 32;

	// ==========================================================================
	// Errors
	// ==========================================================================

	export class P256Error extends Error {
		constructor(message: string) {
			super(message);
			this.name = "P256Error";
		}
	}

	export class InvalidSignatureError extends P256Error {
		constructor(message: string) {
			super(message);
			this.name = "InvalidSignatureError";
		}
	}

	export class InvalidPublicKeyError extends P256Error {
		constructor(message: string) {
			super(message);
			this.name = "InvalidPublicKeyError";
		}
	}

	export class InvalidPrivateKeyError extends P256Error {
		constructor(message: string) {
			super(message);
			this.name = "InvalidPrivateKeyError";
		}
	}

	// ==========================================================================
	// Signing Operations
	// ==========================================================================

	export function sign(messageHash: Hash, privateKey: PrivateKey): Signature {
		if (privateKey.length !== PRIVATE_KEY_SIZE) {
			throw new InvalidPrivateKeyError(
				`Private key must be ${PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`,
			);
		}

		try {
			const result = loader.p256Sign(messageHash, privateKey);
			return {
				r: result.slice(0, 32),
				s: result.slice(32, 64),
			};
		} catch (error) {
			throw new P256Error(`Signing failed: ${error}`);
		}
	}

	// ==========================================================================
	// Verification Operations
	// ==========================================================================

	export function verify(
		signature: Signature,
		messageHash: Hash,
		publicKey: PublicKey,
	): boolean {
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

		try {
			const sig = new Uint8Array(64);
			sig.set(signature.r, 0);
			sig.set(signature.s, 32);
			return loader.p256Verify(messageHash, sig, publicKey);
		} catch {
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

		try {
			return loader.p256DerivePublicKey(privateKey);
		} catch (error) {
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

		try {
			return loader.p256Ecdh(privateKey, publicKey);
		} catch (error) {
			throw new P256Error(`ECDH failed: ${error}`);
		}
	}

	// ==========================================================================
	// Validation
	// ==========================================================================

	export function validatePrivateKey(privateKey: PrivateKey): boolean {
		if (privateKey.length !== PRIVATE_KEY_SIZE) {
			return false;
		}

		// Check if key is in valid range [1, n-1]
		const keyBigInt = BigInt(
			`0x${Array.from(privateKey)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("")}`,
		);
		return keyBigInt > 0n && keyBigInt < CURVE_ORDER;
	}

	export function validatePublicKey(publicKey: PublicKey): boolean {
		if (publicKey.length !== PUBLIC_KEY_SIZE) {
			return false;
		}

		// Basic validation - should be on curve, but checking that requires curve ops
		// For now just check it's not all zeros
		return publicKey.some((b) => b !== 0);
	}
}
