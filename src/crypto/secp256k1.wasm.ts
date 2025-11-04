/**
 * WASM implementation of secp256k1/ECDSA operations
 *
 * Provides the same interface as the Noble-based implementation,
 * using WebAssembly for cryptographic operations.
 */

import { secp256k1 } from "@noble/curves/secp256k1.js";
import type { Hash } from "../primitives/Hash/index.js";
import * as loader from "../wasm-loader/loader.js";
import {
	InvalidPrivateKeyError,
	InvalidPublicKeyError,
	InvalidSignatureError,
	Secp256k1Error,
} from "./secp256k1.js";

// ============================================================================
// Main Secp256k1Wasm Namespace
// ============================================================================

export namespace Secp256k1Wasm {
	// ==========================================================================
	// Core Types (same as Noble implementation)
	// ==========================================================================

	export type Signature = {
		r: Uint8Array;
		s: Uint8Array;
		v: number;
	};

	export type PublicKey = Uint8Array;
	export type PrivateKey = Uint8Array;

	// ==========================================================================
	// Constants
	// ==========================================================================

	export const CURVE_ORDER =
		0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
	export const PRIVATE_KEY_SIZE = 32;
	export const PUBLIC_KEY_SIZE = 64;
	export const SIGNATURE_COMPONENT_SIZE = 32;

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
			const result = loader.secp256k1Sign(messageHash, privateKey);
			// Convert v from 0-1 to Ethereum 27-28
			return {
				r: result.r,
				s: result.s,
				v: 27 + result.v,
			};
		} catch (error) {
			throw new Secp256k1Error(`Signing failed: ${error}`);
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

		try {
			return loader.secp256k1Verify(
				messageHash,
				signature.r,
				signature.s,
				publicKey,
			);
		} catch {
			return false;
		}
	}

	// ==========================================================================
	// Public Key Recovery
	// ==========================================================================

	export function recoverPublicKey(
		signature: Signature,
		messageHash: Hash,
	): PublicKey {
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

		// Convert Ethereum v to recovery bit
		let recoveryBit: number;
		if (signature.v === 27 || signature.v === 28) {
			recoveryBit = signature.v - 27;
		} else if (signature.v === 0 || signature.v === 1) {
			recoveryBit = signature.v;
		} else {
			throw new InvalidSignatureError(
				`Invalid v value: ${signature.v} (expected 0, 1, 27, or 28)`,
			);
		}

		try {
			return loader.secp256k1RecoverPubkey(
				messageHash,
				signature.r,
				signature.s,
				recoveryBit,
			);
		} catch (error) {
			throw new InvalidSignatureError(`Public key recovery failed: ${error}`);
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

		try {
			return loader.secp256k1PubkeyFromPrivate(privateKey);
		} catch (error) {
			throw new InvalidPrivateKeyError(`Key derivation failed: ${error}`);
		}
	}

	// ==========================================================================
	// Validation
	// ==========================================================================

	export function isValidSignature(signature: Signature): boolean {
		if (signature.r.length !== SIGNATURE_COMPONENT_SIZE) return false;
		if (signature.s.length !== SIGNATURE_COMPONENT_SIZE) return false;

		try {
			const r = bytes32ToBigInt(signature.r);
			const s = bytes32ToBigInt(signature.s);

			// r and s must be in [1, n-1]
			if (r === 0n || r >= CURVE_ORDER) return false;
			if (s === 0n || s >= CURVE_ORDER) return false;

			// Ethereum enforces s <= n/2 to prevent malleability
			const halfN = CURVE_ORDER / 2n;
			if (s > halfN) return false;

			// v must be 0, 1, 27, or 28
			if (
				signature.v !== 0 &&
				signature.v !== 1 &&
				signature.v !== 27 &&
				signature.v !== 28
			) {
				return false;
			}

			return true;
		} catch {
			return false;
		}
	}

	export function isValidPublicKey(publicKey: PublicKey): boolean {
		if (publicKey.length !== PUBLIC_KEY_SIZE) return false;

		try {
			// Use Noble's validation since there's no dedicated WASM function
			// Add 0x04 prefix for uncompressed key
			const prefixedKey = new Uint8Array(PUBLIC_KEY_SIZE + 1);
			prefixedKey[0] = 0x04;
			prefixedKey.set(publicKey, 1);

			// Try to create a point from bytes - will throw if invalid
			secp256k1.Point.fromBytes(prefixedKey);
			return true;
		} catch {
			return false;
		}
	}

	export function isValidPrivateKey(privateKey: PrivateKey): boolean {
		if (privateKey.length !== PRIVATE_KEY_SIZE) return false;

		try {
			const value = bytes32ToBigInt(privateKey);

			// Private key must be in [1, n-1]
			if (value === 0n || value >= CURVE_ORDER) return false;

			return true;
		} catch {
			return false;
		}
	}

	// ==========================================================================
	// Signature Formatting
	// ==========================================================================

	export namespace Signature {
		export function toCompact(sig: Secp256k1Wasm.Signature): Uint8Array {
			return concat(sig.r, sig.s);
		}

		export function toBytes(sig: Secp256k1Wasm.Signature): Uint8Array {
			const result = new Uint8Array(65);
			result.set(sig.r, 0);
			result.set(sig.s, 32);
			result[64] = sig.v;
			return result;
		}

		export function fromCompact(
			compact: Uint8Array,
			v: number,
		): Secp256k1Wasm.Signature {
			if (compact.length !== 64) {
				throw new InvalidSignatureError(
					`Compact signature must be 64 bytes, got ${compact.length}`,
				);
			}

			return {
				r: compact.slice(0, 32),
				s: compact.slice(32, 64),
				v,
			};
		}

		export function fromBytes(bytes: Uint8Array): Secp256k1Wasm.Signature {
			if (bytes.length !== 65) {
				throw new InvalidSignatureError(
					`Signature must be 65 bytes, got ${bytes.length}`,
				);
			}

			return {
				r: bytes.slice(0, 32),
				s: bytes.slice(32, 64),
				v: bytes[64] ?? 0,
			};
		}
	}
}

// ============================================================================
// Internal Utilities
// ============================================================================

function bytes32ToBigInt(bytes: Uint8Array): bigint {
	if (bytes.length !== 32) {
		throw new Error(`Expected 32 bytes, got ${bytes.length}`);
	}
	let result = 0n;
	for (let i = 0; i < 32; i++) {
		result = (result << 8n) | BigInt(bytes[i] ?? 0);
	}
	return result;
}

function concat(...arrays: Uint8Array[]): Uint8Array {
	const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
	const result = new Uint8Array(totalLength);
	let offset = 0;
	for (const arr of arrays) {
		result.set(arr, offset);
		offset += arr.length;
	}
	return result;
}

export default Secp256k1Wasm;
