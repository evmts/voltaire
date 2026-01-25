/**
 * @fileoverview AesGcmService Effect service definition for AES-GCM encryption.
 * @module AesGcm/AesGcmService
 * @since 0.0.1
 */
import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";

/**
 * Shape interface for AES-GCM encryption service operations.
 *
 * @description
 * Defines the contract for AES-GCM implementations. All methods return Effect
 * types for composable, type-safe async/error handling.
 *
 * @since 0.0.1
 */
export interface AesGcmServiceShape {
	/**
	 * Encrypts plaintext using AES-GCM.
	 * @param key - 16-byte (128-bit) or 32-byte (256-bit) key
	 * @param plaintext - Data to encrypt
	 * @param nonce - 12-byte (96-bit) nonce/IV (must be unique per key)
	 * @param aad - Optional additional authenticated data
	 * @returns Effect containing ciphertext with appended 16-byte auth tag
	 */
	readonly encrypt: (
		key: Uint8Array,
		plaintext: Uint8Array,
		nonce: Uint8Array,
		aad?: Uint8Array,
	) => Effect.Effect<Uint8Array, Error>;
	/**
	 * Decrypts ciphertext using AES-GCM.
	 * @param key - Same key used for encryption
	 * @param ciphertext - Encrypted data with appended auth tag
	 * @param nonce - Same nonce used for encryption
	 * @param aad - Same AAD used for encryption (if any)
	 * @returns Effect containing decrypted plaintext
	 * @throws Error if authentication fails
	 */
	readonly decrypt: (
		key: Uint8Array,
		ciphertext: Uint8Array,
		nonce: Uint8Array,
		aad?: Uint8Array,
	) => Effect.Effect<Uint8Array, Error>;
	/**
	 * Generates a cryptographically random AES key.
	 * @param bits - Key size: 128 or 256 (default: 256)
	 * @returns Effect containing the random key bytes
	 */
	readonly generateKey: (bits?: 128 | 256) => Effect.Effect<Uint8Array, Error>;
	/**
	 * Generates a cryptographically random 96-bit nonce.
	 * @returns Effect containing 12-byte nonce
	 */
	readonly generateNonce: () => Effect.Effect<Uint8Array, Error>;
}

/**
 * AES-GCM authenticated encryption service for Effect-based applications.
 *
 * @description
 * Provides AES-GCM encryption with 128 or 256-bit keys. Includes authentication
 * via Galois/Counter Mode to ensure data integrity.
 *
 * @example
 * ```typescript
 * import { AesGcmService, AesGcmLive } from 'voltaire-effect/crypto/AesGcm'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const aes = yield* AesGcmService
 *   const key = yield* aes.generateKey(256)
 *   const nonce = yield* aes.generateNonce()
 *   return yield* aes.encrypt(key, plaintext, nonce)
 * }).pipe(Effect.provide(AesGcmLive))
 * ```
 *
 * @since 0.0.1
 */
export class AesGcmService extends Context.Tag("AesGcmService")<
	AesGcmService,
	AesGcmServiceShape
>() {}
