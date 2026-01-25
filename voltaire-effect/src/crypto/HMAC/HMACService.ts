import { HMAC } from '@tevm/voltaire'
import type { HMACType } from '@tevm/voltaire/HMAC'
import * as Effect from 'effect/Effect'
import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'

/**
 * Shape interface for HMAC (Hash-based Message Authentication Code) operations.
 * @since 0.0.1
 */
export interface HMACServiceShape {
  /**
   * Computes HMAC-SHA256.
   * @param key - The secret key
   * @param message - The message to authenticate
   * @returns Effect containing the 32-byte HMAC
   */
  readonly sha256: (key: Uint8Array, message: Uint8Array) => Effect.Effect<HMACType>

  /**
   * Computes HMAC-SHA512.
   * @param key - The secret key
   * @param message - The message to authenticate
   * @returns Effect containing the 64-byte HMAC
   */
  readonly sha512: (key: Uint8Array, message: Uint8Array) => Effect.Effect<HMACType>
}

/**
 * HMAC service for Effect-based applications.
 * Provides keyed hash message authentication for data integrity.
 *
 * @example
 * ```typescript
 * import { HMACService, HMACLive } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const hmac = yield* HMACService
 *   return yield* hmac.sha256(key, message)
 * }).pipe(Effect.provide(HMACLive))
 * ```
 * @since 0.0.1
 */
export class HMACService extends Context.Tag("HMACService")<
  HMACService,
  HMACServiceShape
>() {}

/**
 * Production layer for HMACService using native HMAC implementation.
 * @since 0.0.1
 */
export const HMACLive = Layer.succeed(HMACService, {
  sha256: (key, message) => Effect.sync(() => HMAC.sha256(key, message)),
  sha512: (key, message) => Effect.sync(() => HMAC.sha512(key, message))
})

/**
 * Test layer for HMACService returning deterministic mock values.
 * Use for unit testing without cryptographic overhead.
 * @since 0.0.1
 */
export const HMACTest = Layer.succeed(HMACService, {
  sha256: (_key, _message) => Effect.succeed(new Uint8Array(32) as HMACType),
  sha512: (_key, _message) => Effect.succeed(new Uint8Array(64) as HMACType)
})
