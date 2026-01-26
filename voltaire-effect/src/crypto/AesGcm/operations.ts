/**
 * @fileoverview AES-GCM encryption operations for Effect.
 * @module AesGcm/operations
 * @since 0.0.1
 */

import { AesGcm } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import { InvalidKeyError, InvalidNonceError } from "./errors.js";

const VALID_KEY_LENGTHS = [16, 24, 32] as const;
const NONCE_LENGTH = 12;

const validateKey = (key: Uint8Array) =>
	VALID_KEY_LENGTHS.includes(key.length as 16 | 24 | 32)
		? Effect.void
		: Effect.fail(
				new InvalidKeyError({
					message: `Key must be 16, 24, or 32 bytes, got ${key.length}`,
					keyLength: key.length,
					expectedLengths: VALID_KEY_LENGTHS,
				}),
			);

const validateNonce = (nonce: Uint8Array) =>
	nonce.length === NONCE_LENGTH
		? Effect.void
		: Effect.fail(
				new InvalidNonceError({
					message: `Nonce must be ${NONCE_LENGTH} bytes, got ${nonce.length}`,
					nonceLength: nonce.length,
					expectedLength: NONCE_LENGTH,
				}),
			);

/**
 * Encrypts plaintext using AES-GCM.
 *
 * @description
 * Encrypts data using AES-GCM mode with a 128-bit authentication tag.
 * The ciphertext includes the auth tag appended at the end.
 *
 * @param key - 16-byte (128-bit) or 32-byte (256-bit) symmetric key
 * @param plaintext - Data to encrypt (any length)
 * @param nonce - 12-byte (96-bit) nonce/IV - MUST be unique per key
 * @param aad - Optional additional authenticated data (authenticated but not encrypted)
 * @returns Effect containing ciphertext (plaintext.length + 16 bytes for auth tag)
 *
 * @example
 * ```typescript
 * import { encrypt, generateKey, generateNonce } from 'voltaire-effect/crypto/AesGcm'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const key = yield* generateKey(256)
 *   const nonce = yield* generateNonce()
 *   return yield* encrypt(key, new Uint8Array([1, 2, 3]), nonce)
 * })
 * ```
 *
 * @throws Error if key or nonce has invalid length
 * @see {@link decrypt} to decrypt the ciphertext
 * @since 0.0.1
 */
export const encrypt = (
	key: Uint8Array,
	plaintext: Uint8Array,
	nonce: Uint8Array,
	aad?: Uint8Array,
): Effect.Effect<Uint8Array, Error | InvalidKeyError | InvalidNonceError> =>
	Effect.gen(function* () {
		yield* validateKey(key);
		yield* validateNonce(nonce);
		return yield* Effect.tryPromise({
			try: async () => {
				const cryptoKey = await AesGcm.importKey(key);
				return AesGcm.encrypt(plaintext, cryptoKey, nonce, aad);
			},
			catch: (e) => e as Error,
		});
	});

/**
 * Decrypts ciphertext using AES-GCM.
 *
 * @description
 * Decrypts and authenticates AES-GCM ciphertext. Verifies the 128-bit
 * authentication tag appended to the ciphertext.
 *
 * @param key - Same key used for encryption
 * @param ciphertext - Encrypted data with 16-byte auth tag appended
 * @param nonce - Same 12-byte nonce used for encryption
 * @param aad - Same additional authenticated data used for encryption (if any)
 * @returns Effect containing decrypted plaintext
 *
 * @example
 * ```typescript
 * import { decrypt, encrypt, generateKey, generateNonce } from 'voltaire-effect/crypto/AesGcm'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const key = yield* generateKey(256)
 *   const nonce = yield* generateNonce()
 *   const ciphertext = yield* encrypt(key, plaintext, nonce)
 *   return yield* decrypt(key, ciphertext, nonce)
 * })
 * ```
 *
 * @throws Error if authentication fails (data tampered or wrong key/nonce)
 * @see {@link encrypt} to encrypt data
 * @since 0.0.1
 */
export const decrypt = (
	key: Uint8Array,
	ciphertext: Uint8Array,
	nonce: Uint8Array,
	aad?: Uint8Array,
): Effect.Effect<Uint8Array, Error | InvalidKeyError | InvalidNonceError> =>
	Effect.gen(function* () {
		yield* validateKey(key);
		yield* validateNonce(nonce);
		return yield* Effect.tryPromise({
			try: async () => {
				const cryptoKey = await AesGcm.importKey(key);
				return AesGcm.decrypt(ciphertext, cryptoKey, nonce, aad);
			},
			catch: (e) => e as Error,
		});
	});

/**
 * Generates a cryptographically random AES key.
 *
 * @description
 * Uses the Web Crypto API to generate a cryptographically secure
 * random key suitable for AES-GCM encryption.
 *
 * @param bits - Key size: 128 or 256 bits (default: 256)
 * @returns Effect containing the raw key bytes (16 or 32 bytes)
 *
 * @example
 * ```typescript
 * import { generateKey } from 'voltaire-effect/crypto/AesGcm'
 * import * as Effect from 'effect/Effect'
 *
 * const program = generateKey(256) // 32-byte key
 * ```
 *
 * @throws Never fails
 * @see {@link generateNonce} to generate a nonce
 * @since 0.0.1
 */
export const generateKey = (
	bits: 128 | 256 = 256,
): Effect.Effect<Uint8Array, Error> =>
	Effect.tryPromise({
		try: async () => {
			const cryptoKey = await AesGcm.generateKey(bits);
			return AesGcm.exportKey(cryptoKey);
		},
		catch: (e) => e as Error,
	});

/**
 * Generates a cryptographically random 96-bit nonce.
 *
 * @description
 * Generates a 12-byte nonce suitable for AES-GCM. Each nonce MUST be
 * unique for a given key - reusing a nonce breaks the security of GCM.
 *
 * @returns Effect containing 12-byte random nonce
 *
 * @example
 * ```typescript
 * import { generateNonce } from 'voltaire-effect/crypto/AesGcm'
 * import * as Effect from 'effect/Effect'
 *
 * const program = generateNonce() // 12-byte nonce
 * ```
 *
 * @throws Never fails
 * @see {@link generateKey} to generate a key
 * @since 0.0.1
 */
export const generateNonce = (): Effect.Effect<Uint8Array, Error> =>
	Effect.try({
		try: () => AesGcm.generateNonce(),
		catch: (e) => e as Error,
	});
