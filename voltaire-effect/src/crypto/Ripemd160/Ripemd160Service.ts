import { Ripemd160 } from '@tevm/voltaire'
import type { Ripemd160Hash } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'

/**
 * RIPEMD-160 hashing service for Effect-based applications.
 * Used in Bitcoin address generation (combined with SHA-256).
 *
 * @example
 * ```typescript
 * import { Ripemd160Service, Ripemd160Live } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const ripemd = yield* Ripemd160Service
 *   return yield* ripemd.hash(new Uint8Array([1, 2, 3]))
 * }).pipe(Effect.provide(Ripemd160Live))
 * ```
 * @since 0.0.1
 */
export class Ripemd160Service extends Context.Tag("Ripemd160Service")<
  Ripemd160Service,
  {
    /**
     * Computes the RIPEMD-160 hash of input data.
     * @param data - The input bytes to hash
     * @returns Effect containing the 20-byte hash
     */
    readonly hash: (data: Uint8Array) => Effect.Effect<Ripemd160Hash>
  }
>() {}

/**
 * Production layer for Ripemd160Service using native RIPEMD-160 implementation.
 * @since 0.0.1
 */
export const Ripemd160Live = Layer.succeed(Ripemd160Service, {
  hash: (data) => Effect.sync(() => Ripemd160.hash(data))
})

/**
 * Test layer for Ripemd160Service returning deterministic zero-filled hashes.
 * Use for unit testing without cryptographic overhead.
 * @since 0.0.1
 */
export const Ripemd160Test = Layer.succeed(Ripemd160Service, {
  hash: (_data) => Effect.sync(() => new Uint8Array(20) as Ripemd160Hash)
})
