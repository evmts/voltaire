import { Blake2 } from '@tevm/voltaire'
import type { Blake2Hash } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'

/**
 * Blake2 hashing service for Effect-based applications.
 * Blake2b is a cryptographic hash function faster than SHA-256, used in various blockchain protocols.
 *
 * @example
 * ```typescript
 * import { Blake2Service, Blake2Live } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const blake2 = yield* Blake2Service
 *   return yield* blake2.hash(new Uint8Array([1, 2, 3]), 32)
 * }).pipe(Effect.provide(Blake2Live))
 * ```
 * @since 0.0.1
 */
export class Blake2Service extends Context.Tag("Blake2Service")<
  Blake2Service,
  {
    /**
     * Computes the Blake2b hash of input data.
     * @param data - The input bytes to hash
     * @param outputLength - Desired output length in bytes (default: 64)
     * @returns Effect containing the hash of specified length
     */
    readonly hash: (data: Uint8Array, outputLength?: number) => Effect.Effect<Blake2Hash>
  }
>() {}

/**
 * Production layer for Blake2Service using native Blake2b implementation.
 * @since 0.0.1
 */
export const Blake2Live = Layer.succeed(Blake2Service, {
  hash: (data, outputLength = 64) => Effect.sync(() => Blake2.hash(data, outputLength))
})

/**
 * Test layer for Blake2Service returning deterministic zero-filled hashes.
 * Use for unit testing without cryptographic overhead.
 * @since 0.0.1
 */
export const Blake2Test = Layer.succeed(Blake2Service, {
  hash: (_data, outputLength = 64) => Effect.sync(() => new Uint8Array(outputLength) as Blake2Hash)
})
