/**
 * @fileoverview Ed25519 cryptographic signature service for Effect-based applications.
 * Provides high-performance elliptic curve digital signatures.
 * @module Ed25519Service
 * @since 0.0.1
 */

import type {
	Ed25519Error,
	InvalidPublicKeyError,
	InvalidSecretKeyError,
	InvalidSignatureError,
} from "@tevm/voltaire/Ed25519";
import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";

/**
 * Shape interface for Ed25519 cryptographic service operations.
 *
 * @description
 * Defines the contract for Ed25519 signature operations including signing,
 * verification, and public key derivation. All operations return Effects
 * that may fail with typed errors.
 *
 * @see {@link Ed25519Service} - The service using this shape
 * @since 0.0.1
 */
export interface Ed25519ServiceShape {
	/**
	 * Signs a message using Ed25519 signature scheme.
	 *
	 * @description
	 * Creates a 64-byte EdDSA signature using the Ed25519 curve.
	 * The signature is deterministic - the same message and key always
	 * produce the same signature.
	 *
	 * @param message - The message bytes to sign (any length)
	 * @param secretKey - The 32-byte secret key
	 * @returns Effect containing the 64-byte signature
	 * @throws InvalidSecretKeyError - When the secret key is invalid
	 * @throws Ed25519Error - When signing fails
	 */
	readonly sign: (
		message: Uint8Array,
		secretKey: Uint8Array,
	) => Effect.Effect<Uint8Array, InvalidSecretKeyError | Ed25519Error>;

	/**
	 * Verifies an Ed25519 signature against a message and public key.
	 *
	 * @description
	 * Validates that a signature was created by the holder of the private
	 * key corresponding to the given public key for the specified message.
	 *
	 * @param signature - The 64-byte Ed25519 signature
	 * @param message - The original message bytes
	 * @param publicKey - The 32-byte public key
	 * @returns Effect containing true if signature is valid, false otherwise
	 * @throws InvalidSignatureError - When the signature format is invalid
	 * @throws InvalidPublicKeyError - When the public key is invalid
	 */
	readonly verify: (
		signature: Uint8Array,
		message: Uint8Array,
		publicKey: Uint8Array,
	) => Effect.Effect<boolean, InvalidSignatureError | InvalidPublicKeyError>;

	/**
	 * Derives a public key from a secret key.
	 *
	 * @description
	 * Computes the Ed25519 public key corresponding to a given secret key.
	 * The derivation is one-way - the secret key cannot be recovered from
	 * the public key.
	 *
	 * @param secretKey - The 32-byte secret key
	 * @returns Effect containing the 32-byte public key
	 * @throws InvalidSecretKeyError - When the secret key is invalid
	 */
	readonly getPublicKey: (
		secretKey: Uint8Array,
	) => Effect.Effect<Uint8Array, InvalidSecretKeyError>;
}

/**
 * Ed25519 cryptographic service for Effect-based applications.
 *
 * @description
 * Ed25519 is a high-speed, high-security elliptic curve digital signature
 * algorithm. It provides fast signing and verification while being resistant
 * to timing attacks and other side-channel attacks.
 *
 * Key features:
 * - 32-byte keys and 64-byte signatures
 * - Deterministic signatures (no random nonce)
 * - Fast verification (~3x faster than ECDSA)
 * - Used in Solana, Cardano, Polkadot, SSH, and many other protocols
 *
 * @example
 * ```typescript
 * import { Ed25519Service, Ed25519Live } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * // Complete sign and verify workflow
 * const program = Effect.gen(function* () {
 *   const ed = yield* Ed25519Service
 *
 *   // Derive public key from secret key
 *   const publicKey = yield* ed.getPublicKey(secretKey)
 *
 *   // Sign a message
 *   const message = new TextEncoder().encode('Hello, Ed25519!')
 *   const signature = yield* ed.sign(message, secretKey)
 *
 *   // Verify the signature
 *   const isValid = yield* ed.verify(signature, message, publicKey)
 *   return { publicKey, signature, isValid }
 * }).pipe(Effect.provide(Ed25519Live))
 *
 * const result = await Effect.runPromise(program)
 * console.log(result.isValid) // true
 * ```
 *
 * @see {@link Ed25519Live} - Production layer using native Ed25519
 * @see {@link Ed25519Test} - Test layer with deterministic output
 * @see {@link sign} - Standalone sign function
 * @see {@link verify} - Standalone verify function
 * @see {@link getPublicKey} - Standalone key derivation function
 * @since 0.0.1
 */
export class Ed25519Service extends Context.Tag("Ed25519Service")<
	Ed25519Service,
	Ed25519ServiceShape
>() {}
