import type { Blake2Hash } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import { Blake2Service } from './Blake2Service.js'

/**
 * Computes the Blake2b hash of the provided data.
 * Blake2 is a fast cryptographic hash function, suitable for high-performance hashing needs.
 *
 * @param data - The input bytes to hash
 * @param outputLength - Desired output length in bytes (default: 64)
 * @returns Effect containing the Blake2b hash, requiring Blake2Service
 * @example
 * ```typescript
 * import { hash, Blake2Live } from 'voltaire-effect/crypto/Blake2'
 * import * as Effect from 'effect/Effect'
 *
 * const program = hash(new Uint8Array([1, 2, 3]), 32).pipe(
 *   Effect.provide(Blake2Live)
 * )
 * ```
 * @since 0.0.1
 */
export const hash = (data: Uint8Array, outputLength?: number): Effect.Effect<Blake2Hash, never, Blake2Service> =>
  Effect.gen(function* () {
    const blake2 = yield* Blake2Service
    return yield* blake2.hash(data, outputLength)
  })
