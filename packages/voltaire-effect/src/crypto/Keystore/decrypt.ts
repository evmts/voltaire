/**
 * @fileoverview Keystore decryption for Effect.
 * @module Keystore/decrypt
 * @since 0.0.1
 */

import {
	InvalidMacError,
	InvalidPbkdf2IterationsError,
	InvalidScryptNError,
	Keystore,
	DecryptionError as KeystoreDecryptionError,
	UnsupportedKdfError,
	UnsupportedVersionError,
} from "@tevm/voltaire/Keystore";
import * as Effect from "effect/Effect";
import type { DecryptError, PrivateKeyType } from "./KeystoreService.js";

type KeystoreV3 = Parameters<typeof Keystore.decrypt>[0];

const toDecryptError = (error: unknown): DecryptError => {
	if (error instanceof KeystoreDecryptionError) return error;
	if (error instanceof InvalidMacError) return error;
	if (error instanceof UnsupportedVersionError) return error;
	if (error instanceof UnsupportedKdfError) return error;
	if (error instanceof InvalidScryptNError) return error;
	if (error instanceof InvalidPbkdf2IterationsError) return error;

	const message = error instanceof Error ? error.message : String(error);
	return new KeystoreDecryptionError(message, {
		cause: error instanceof Error ? error : undefined,
	});
};

/**
 * Decrypts a keystore with a password to recover the private key.
 *
 * @description
 * Decrypts an Ethereum-compatible keystore (Web3 Secret Storage) using the provided
 * password. Verifies the MAC to ensure password correctness and data integrity.
 *
 * @param keystore - The KeystoreV3 JSON structure to decrypt
 * @param password - Password used during encryption
 * @returns Effect containing the 32-byte private key
 *
 * @example
 * ```typescript
 * import { decrypt, KeystoreLive } from 'voltaire-effect/crypto/Keystore'
 * import * as Effect from 'effect/Effect'
 *
 * const program = decrypt(keystoreJson, 'my-password').pipe(
 *   Effect.provide(KeystoreLive)
 * )
 * ```
 *
 * @throws DecryptionError if decryption fails
 * @throws InvalidMacError if password is wrong or data is corrupted
 * @throws UnsupportedVersionError if keystore version is not supported
 * @throws UnsupportedKdfError if KDF is not supported
 * @throws InvalidScryptNError if keystore scrypt params are invalid
 * @throws InvalidPbkdf2IterationsError if keystore PBKDF2 params are invalid
 * @see {@link encrypt} to create a keystore
 * @since 0.0.1
 */
export const decrypt = (
	keystore: KeystoreV3,
	password: string,
): Effect.Effect<PrivateKeyType, DecryptError> =>
	Effect.try({
		try: () => Keystore.decrypt(keystore, password),
		catch: toDecryptError,
	});

/**
 * Decrypts a keystore, uses the private key, and zeroes it after use.
 *
 * @description
 * Wraps {@link decrypt} with `Effect.acquireRelease` to ensure key material
 * is wiped from memory after the provided effect completes.
 *
 * @param keystore - The KeystoreV3 JSON structure to decrypt
 * @param password - Password used during encryption
 * @param use - Effect that consumes the decrypted private key
 * @returns Effect containing the result of `use`
 *
 * @example
 * ```typescript
 * import { withDecryptedKey, KeystoreLive } from 'voltaire-effect/crypto/Keystore'
 * import * as Effect from 'effect/Effect'
 *
 * const program = withDecryptedKey(keystoreJson, 'my-password', (key) =>
 *   Effect.sync(() => key)
 * ).pipe(Effect.provide(KeystoreLive))
 * ```
 *
 * @since 0.0.1
 */
export const withDecryptedKey = <R, E, A>(
	keystore: KeystoreV3,
	password: string,
	use: (privateKey: PrivateKeyType) => Effect.Effect<A, E, R>,
): Effect.Effect<A, E | DecryptError, R> =>
	Effect.acquireRelease(decrypt(keystore, password), (privateKey) =>
		Effect.sync(() => privateKey.fill(0)),
	).pipe(Effect.flatMap(use), Effect.scoped);
