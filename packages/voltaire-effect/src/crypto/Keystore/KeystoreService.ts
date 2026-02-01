/**
 * @fileoverview KeystoreService Effect service definition for keystore encryption.
 * @module Keystore/KeystoreService
 * @since 0.0.1
 */

import type {
	Keystore,
	DecryptionError as KeystoreDecryptionError,
	EncryptionError as KeystoreEncryptionError,
	InvalidMacError as KeystoreInvalidMacError,
	InvalidPbkdf2IterationsError as KeystoreInvalidPbkdf2IterationsError,
	InvalidScryptNError as KeystoreInvalidScryptNError,
	UnsupportedKdfError as KeystoreUnsupportedKdfError,
	UnsupportedVersionError as KeystoreUnsupportedVersionError,
} from "@tevm/voltaire/Keystore";
import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";

type EncryptOptions = Parameters<typeof Keystore.encrypt>[2];
type KeystoreV3 = Awaited<ReturnType<typeof Keystore.encrypt>>;
type EncryptionError =
	| KeystoreEncryptionError
	| KeystoreInvalidScryptNError
	| KeystoreInvalidPbkdf2IterationsError;

/**
 * PrivateKey type - 32 byte Uint8Array for cryptographic operations.
 * @since 0.0.1
 */
export type PrivateKeyType = Uint8Array;

/**
 * Union of all possible decryption errors.
 *
 * @description
 * Represents errors that can occur during keystore decryption:
 * - DecryptionError: General decryption failure
 * - InvalidMacError: MAC verification failed (wrong password or corrupted data)
 * - UnsupportedVersionError: Keystore version not supported
 * - UnsupportedKdfError: Key derivation function not supported
 * - InvalidScryptNError: Invalid scrypt parameter from keystore
 * - InvalidPbkdf2IterationsError: Invalid PBKDF2 iteration count from keystore
 *
 * @since 0.0.1
 */
export type DecryptError =
	| KeystoreDecryptionError
	| KeystoreInvalidMacError
	| KeystoreUnsupportedVersionError
	| KeystoreUnsupportedKdfError
	| KeystoreInvalidScryptNError
	| KeystoreInvalidPbkdf2IterationsError;

/**
 * Shape interface for keystore encryption service operations.
 *
 * @description
 * Defines the contract for keystore implementations. All methods return Effect
 * types for composable, type-safe async/error handling.
 *
 * @since 0.0.1
 */
export interface KeystoreServiceShape {
	/**
	 * Encrypts a private key with a password.
	 * @param privateKey - The 32-byte private key to encrypt
	 * @param password - Password for key derivation
	 * @param options - Optional encryption parameters (kdf, cipher, etc.)
	 * @returns Effect containing the KeystoreV3 JSON structure
	 */
	readonly encrypt: (
		privateKey: PrivateKeyType,
		password: string,
		options?: EncryptOptions,
	) => Effect.Effect<KeystoreV3, EncryptionError>;

	/**
	 * Decrypts a keystore with a password.
	 * @param keystore - The KeystoreV3 JSON structure
	 * @param password - Password used during encryption
	 * @returns Effect containing the decrypted private key
	 */
	readonly decrypt: (
		keystore: KeystoreV3,
		password: string,
	) => Effect.Effect<PrivateKeyType, DecryptError>;
}

/**
 * Ethereum keystore service for Effect-based applications.
 *
 * @description
 * Provides password-based encryption and decryption of private keys using
 * the Web3 Secret Storage Definition (Keystore V3 format).
 *
 * @example
 * ```typescript
 * import { KeystoreService, KeystoreLive } from 'voltaire-effect/crypto/Keystore'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const ks = yield* KeystoreService
 *   const keystore = yield* ks.encrypt(privateKey, 'password')
 *   const decrypted = yield* ks.decrypt(keystore, 'password')
 *   return decrypted
 * }).pipe(Effect.provide(KeystoreLive))
 * ```
 *
 * @since 0.0.1
 */
export class KeystoreService extends Context.Tag("KeystoreService")<
	KeystoreService,
	KeystoreServiceShape
>() {}
