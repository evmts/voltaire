import type { Ripemd160Hash } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import { Ripemd160Service } from './Ripemd160Service.js'

/**
 * Computes the RIPEMD-160 hash of the provided data.
 * RIPEMD-160 produces a 20-byte hash, used in Bitcoin address generation.
 *
 * @param data - The input bytes to hash
 * @returns Effect containing the 20-byte RIPEMD-160 hash, requiring Ripemd160Service
 * @example
 * ```typescript
 * import { hash, Ripemd160Live } from 'voltaire-effect/crypto/Ripemd160'
 * import * as Effect from 'effect/Effect'
 *
 * const program = hash(new Uint8Array([1, 2, 3])).pipe(
 *   Effect.provide(Ripemd160Live)
 * )
 * ```
 * @since 0.0.1
 */
export const hash = (data: Uint8Array): Effect.Effect<Ripemd160Hash, never, Ripemd160Service> =>
  Effect.gen(function* () {
    const ripemd160 = yield* Ripemd160Service
    return yield* ripemd160.hash(data)
  })
