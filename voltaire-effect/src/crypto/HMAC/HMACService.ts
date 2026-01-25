/**
 * @fileoverview HMAC (Hash-based Message Authentication Code) service for Effect-based applications.
 * Provides keyed hash authentication for data integrity and authenticity.
 * @module HMACService
 * @since 0.0.1
 */

import { HMAC } from '@tevm/voltaire'
import type { HMACType } from '@tevm/voltaire/HMAC'
import * as Effect from 'effect/Effect'
import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'

/**
 * Shape interface for HMAC (Hash-based Message Authentication Code) operations.
 *
 * @description
 * Defines the contract for HMAC operations using SHA-256 and SHA-512 hash
 * functions. HMAC provides both data integrity and authentication using
 * a secret key.
 *
 * @see {@link HMACService} - The service using this shape
 * @since 0.0.1
 */
export interface HMACServiceShape {
  /**
   * Computes HMAC-SHA256.
   *
   * @description
   * Produces a 32-byte authentication code using SHA-256 as the
   * underlying hash function.
   *
   * @param key - The secret key (any length, recommended 32+ bytes)
   * @param message - The message to authenticate
   * @returns Effect containing the 32-byte HMAC
   * @throws Never - This operation is infallible
   */
  readonly sha256: (key: Uint8Array, message: Uint8Array) => Effect.Effect<HMACType>

  /**
   * Computes HMAC-SHA512.
   *
   * @description
   * Produces a 64-byte authentication code using SHA-512 as the
   * underlying hash function. Provides stronger security than SHA-256.
   *
   * @param key - The secret key (any length, recommended 64+ bytes)
   * @param message - The message to authenticate
   * @returns Effect containing the 64-byte HMAC
   * @throws Never - This operation is infallible
   */
  readonly sha512: (key: Uint8Array, message: Uint8Array) => Effect.Effect<HMACType>
}

/**
 * HMAC service for Effect-based applications.
 *
 * @description
 * HMAC (Hash-based Message Authentication Code) provides both data integrity
 * and authentication. Unlike a plain hash, HMAC requires a secret key,
 * ensuring only parties with the key can create or verify the MAC.
 *
 * Common use cases:
 * - API request authentication (e.g., AWS Signature v4)
 * - JWT signature creation and verification
 * - Cookie integrity verification
 * - Key derivation (HKDF uses HMAC internally)
 * - BIP-32 HD wallet derivation
 *
 * Key features:
 * - Keyed authentication (requires secret key)
 * - Prevents tampering detection
 * - Constant-time verification resistant to timing attacks
 *
 * @example
 * ```typescript
 * import { HMACService, HMACLive } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * // Basic HMAC-SHA256
 * const program = Effect.gen(function* () {
 *   const hmac = yield* HMACService
 *
 *   const key = new TextEncoder().encode('secret-key')
 *   const message = new TextEncoder().encode('Hello, HMAC!')
 *
 *   const mac256 = yield* hmac.sha256(key, message)
 *   const mac512 = yield* hmac.sha512(key, message)
 *
 *   return { mac256, mac512 }
 * }).pipe(Effect.provide(HMACLive))
 *
 * const result = await Effect.runPromise(program)
 * console.log(result.mac256.length) // 32
 * console.log(result.mac512.length) // 64
 * ```
 *
 * @see {@link HMACLive} - Production layer using native HMAC
 * @see {@link HMACTest} - Test layer with deterministic output
 * @see {@link hmacSha256}, {@link hmacSha512} - Standalone functions
 * @since 0.0.1
 */
export class HMACService extends Context.Tag("HMACService")<
  HMACService,
  HMACServiceShape
>() {}

/**
 * Production layer for HMACService using native HMAC implementation.
 *
 * @description
 * Provides the live implementation backed by the high-performance native
 * HMAC implementation from @tevm/voltaire. Use this layer in production
 * applications for real cryptographic operations.
 *
 * @example
 * ```typescript
 * import { HMACService, HMACLive } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const computeHmac = Effect.gen(function* () {
 *   const hmac = yield* HMACService
 *   return yield* hmac.sha256(key, message)
 * }).pipe(Effect.provide(HMACLive))
 * ```
 *
 * @see {@link HMACService} - The service definition
 * @see {@link HMACTest} - Test layer for unit testing
 * @since 0.0.1
 */
export const HMACLive = Layer.succeed(HMACService, {
  sha256: (key, message) => Effect.sync(() => HMAC.sha256(key, message)),
  sha512: (key, message) => Effect.sync(() => HMAC.sha512(key, message))
})

/**
 * Test layer for HMACService returning deterministic mock values.
 *
 * @description
 * Provides a mock implementation for unit testing that returns zero-filled
 * arrays of the appropriate length. Use this layer to test code that depends
 * on HMACService without cryptographic overhead.
 *
 * Mock behaviors:
 * - `sha256`: Returns zero-filled 32-byte array
 * - `sha512`: Returns zero-filled 64-byte array
 *
 * @example
 * ```typescript
 * import { HMACService, HMACTest } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const testProgram = Effect.gen(function* () {
 *   const hmac = yield* HMACService
 *   const mac = yield* hmac.sha256(key, message)
 *   // mac is Uint8Array(32) filled with zeros
 *   return mac
 * }).pipe(Effect.provide(HMACTest))
 * ```
 *
 * @see {@link HMACService} - The service definition
 * @see {@link HMACLive} - Production implementation
 * @since 0.0.1
 */
export const HMACTest = Layer.succeed(HMACService, {
  sha256: (_key, _message) => Effect.succeed(new Uint8Array(32) as HMACType),
  sha512: (_key, _message) => Effect.succeed(new Uint8Array(64) as HMACType)
})
