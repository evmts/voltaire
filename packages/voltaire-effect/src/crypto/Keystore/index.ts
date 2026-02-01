/**
 * @fileoverview Ethereum keystore (Web3 Secret Storage) module for Effect.
 * Provides password-based encryption/decryption of private keys per EIP-2335.
 *
 * @module Keystore
 * @since 0.0.1
 *
 * @description
 * Implements the Web3 Secret Storage Definition (formerly known as Keystore V3).
 * Encrypts private keys with password-derived keys using:
 *
 * - Key derivation: scrypt or pbkdf2
 * - Encryption: AES-128-CTR
 * - MAC: keccak256 for integrity verification
 *
 * The resulting JSON keystore file can be used by Ethereum wallets.
 *
 * @example
 * ```typescript
 * import { KeystoreService, KeystoreLive, encrypt, decrypt } from 'voltaire-effect/crypto/Keystore'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const keystore = yield* encrypt(privateKey, 'my-password')
 *   const decrypted = yield* decrypt(keystore, 'my-password')
 *   return decrypted
 * }).pipe(Effect.provide(KeystoreLive))
 * ```
 *
 * @see {@link https://eips.ethereum.org/EIPS/eip-2335 | EIP-2335}
 */

export { decrypt, withDecryptedKey } from "./decrypt.js";
export { encrypt } from "./encrypt.js";
export { KeystoreLive } from "./KeystoreLive.js";
export {
	type DecryptError,
	KeystoreService,
	type KeystoreServiceShape,
} from "./KeystoreService.js";
export { KeystoreTest } from "./KeystoreTest.js";
