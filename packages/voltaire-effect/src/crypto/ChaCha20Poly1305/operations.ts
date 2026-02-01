/**
 * @fileoverview ChaCha20-Poly1305 encryption operations for Effect.
 * @module ChaCha20Poly1305/operations
 * @since 0.0.1
 */
import * as Effect from "effect/Effect";
import { ChaCha20Poly1305Service } from "./ChaCha20Poly1305Service.js";
import type { InvalidKeyError, InvalidNonceError } from "./errors.js";

/**
 * Encrypts plaintext using ChaCha20-Poly1305.
 *
 * @description
 * Encrypts data using the ChaCha20 stream cipher and authenticates with Poly1305 MAC.
 * The ciphertext includes a 16-byte authentication tag appended at the end.
 *
 * @param plaintext - Data to encrypt (any length)
 * @param key - 32-byte (256-bit) symmetric key
 * @param nonce - 12-byte (96-bit) nonce - MUST be unique per key
 * @param additionalData - Optional additional authenticated data (authenticated but not encrypted)
 * @returns Effect containing ciphertext (plaintext.length + 16 bytes for auth tag), requiring ChaCha20Poly1305Service
 *
 * @example
 * ```typescript
 * import { encrypt, generateKey, generateNonce, ChaCha20Poly1305Live } from 'voltaire-effect/crypto/ChaCha20Poly1305'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const key = yield* generateKey()
 *   const nonce = yield* generateNonce()
 *   return yield* encrypt(new Uint8Array([1, 2, 3]), key, nonce)
 * }).pipe(Effect.provide(ChaCha20Poly1305Live))
 * ```
 *
 * @throws Never fails if inputs are valid
 * @see {@link decrypt} to decrypt the ciphertext
 * @since 0.0.1
 */
export const encrypt = (
	plaintext: Uint8Array,
	key: Uint8Array,
	nonce: Uint8Array,
	additionalData?: Uint8Array,
): Effect.Effect<
	Uint8Array,
	InvalidKeyError | InvalidNonceError,
	ChaCha20Poly1305Service
> =>
	Effect.gen(function* () {
		const service = yield* ChaCha20Poly1305Service;
		return yield* service.encrypt(plaintext, key, nonce, additionalData);
	});

/**
 * Decrypts ciphertext using ChaCha20-Poly1305.
 *
 * @description
 * Decrypts and authenticates ChaCha20-Poly1305 ciphertext. Verifies the 128-bit
 * Poly1305 authentication tag appended to the ciphertext.
 *
 * @param ciphertext - Encrypted data with 16-byte auth tag appended
 * @param key - Same 32-byte key used for encryption
 * @param nonce - Same 12-byte nonce used for encryption
 * @param additionalData - Same additional authenticated data used for encryption (if any)
 * @returns Effect containing decrypted plaintext, requiring ChaCha20Poly1305Service
 *
 * @example
 * ```typescript
 * import { decrypt, encrypt, generateKey, generateNonce, ChaCha20Poly1305Live } from 'voltaire-effect/crypto/ChaCha20Poly1305'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const key = yield* generateKey()
 *   const nonce = yield* generateNonce()
 *   const ciphertext = yield* encrypt(plaintext, key, nonce)
 *   return yield* decrypt(ciphertext, key, nonce)
 * }).pipe(Effect.provide(ChaCha20Poly1305Live))
 * ```
 *
 * @throws Error if authentication fails (data tampered or wrong key/nonce)
 * @see {@link encrypt} to encrypt data
 * @since 0.0.1
 */
export const decrypt = (
	ciphertext: Uint8Array,
	key: Uint8Array,
	nonce: Uint8Array,
	additionalData?: Uint8Array,
): Effect.Effect<
	Uint8Array,
	InvalidKeyError | InvalidNonceError,
	ChaCha20Poly1305Service
> =>
	Effect.gen(function* () {
		const service = yield* ChaCha20Poly1305Service;
		return yield* service.decrypt(ciphertext, key, nonce, additionalData);
	});

/**
 * Generates a cryptographically random 256-bit key.
 *
 * @description
 * Uses cryptographically secure random number generation to create
 * a 32-byte key suitable for ChaCha20-Poly1305 encryption.
 *
 * @returns Effect containing 32-byte random key, requiring ChaCha20Poly1305Service
 *
 * @example
 * ```typescript
 * import { generateKey, ChaCha20Poly1305Live } from 'voltaire-effect/crypto/ChaCha20Poly1305'
 * import * as Effect from 'effect/Effect'
 *
 * const program = generateKey().pipe(Effect.provide(ChaCha20Poly1305Live))
 * // Returns: Uint8Array(32)
 * ```
 *
 * @throws Never fails
 * @see {@link generateNonce} to generate a nonce
 * @since 0.0.1
 */
export const generateKey = (): Effect.Effect<
	Uint8Array,
	never,
	ChaCha20Poly1305Service
> =>
	Effect.gen(function* () {
		const service = yield* ChaCha20Poly1305Service;
		return yield* service.generateKey();
	});

/**
 * Generates a cryptographically random 96-bit nonce.
 *
 * @description
 * Generates a 12-byte nonce suitable for ChaCha20-Poly1305. Each nonce MUST be
 * unique for a given key - reusing a nonce completely breaks the security.
 *
 * @returns Effect containing 12-byte random nonce, requiring ChaCha20Poly1305Service
 *
 * @example
 * ```typescript
 * import { generateNonce, ChaCha20Poly1305Live } from 'voltaire-effect/crypto/ChaCha20Poly1305'
 * import * as Effect from 'effect/Effect'
 *
 * const program = generateNonce().pipe(Effect.provide(ChaCha20Poly1305Live))
 * // Returns: Uint8Array(12)
 * ```
 *
 * @throws Never fails
 * @see {@link generateKey} to generate a key
 * @since 0.0.1
 */
export const generateNonce = (): Effect.Effect<
	Uint8Array,
	never,
	ChaCha20Poly1305Service
> =>
	Effect.gen(function* () {
		const service = yield* ChaCha20Poly1305Service;
		return yield* service.generateNonce();
	});
