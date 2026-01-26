/**
 * @fileoverview Keystore decryption for Effect.
 * @module Keystore/decrypt
 * @since 0.0.1
 */

import { Keystore } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import type { DecryptError, PrivateKeyType } from "./KeystoreService.js";

type KeystoreV3 = Parameters<typeof Keystore.decrypt>[0];

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
 * @see {@link encrypt} to create a keystore
 * @since 0.0.1
 */
export const decrypt = (
	keystore: KeystoreV3,
	password: string,
): Effect.Effect<PrivateKeyType, DecryptError> =>
	Effect.try({
		try: () => Keystore.decrypt(keystore, password),
		catch: (e) => e as DecryptError,
	});
