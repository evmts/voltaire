/**
 * @fileoverview Production implementation of KeystoreService.
 * @module Keystore/KeystoreLive
 * @since 0.0.1
 */
import * as Layer from 'effect/Layer'
import { KeystoreService } from './KeystoreService.js'
import { encrypt } from './encrypt.js'
import { decrypt } from './decrypt.js'

/**
 * Production layer for KeystoreService using native implementation.
 *
 * @description
 * Provides real keystore operations using scrypt/pbkdf2 key derivation
 * and AES-128-CTR encryption. Creates Ethereum-compatible keystore files.
 *
 * @example
 * ```typescript
 * import { KeystoreService, KeystoreLive } from 'voltaire-effect/crypto/Keystore'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const ks = yield* KeystoreService
 *   return yield* ks.encrypt(privateKey, 'password')
 * }).pipe(Effect.provide(KeystoreLive))
 * ```
 *
 * @since 0.0.1
 * @see {@link KeystoreTest} for unit testing
 */
export const KeystoreLive = Layer.succeed(
  KeystoreService,
  {
    encrypt,
    decrypt
  }
)
