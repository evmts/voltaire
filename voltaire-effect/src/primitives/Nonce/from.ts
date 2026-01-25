import { Uint } from '@tevm/voltaire'
import type { NonceType } from './NonceSchema.js'
import type { UintError } from '../Uint/from.js'
import * as Effect from 'effect/Effect'

/**
 * Creates a Nonce from a bigint, number, or string, wrapped in an Effect.
 * A nonce is a counter that tracks the number of transactions sent from an account.
 *
 * @param value - The nonce value (must be a non-negative integer)
 * @returns An Effect that resolves to NonceType or fails with UintError
 *
 * @example
 * ```typescript
 * import * as Nonce from 'voltaire-effect/Nonce'
 * import * as Effect from 'effect/Effect'
 *
 * // Create a nonce from bigint
 * const nonce = Effect.runSync(Nonce.from(42n))
 *
 * // Create a nonce from number
 * const fromNumber = Effect.runSync(Nonce.from(0))
 *
 * // Create a nonce from string
 * const fromString = Effect.runSync(Nonce.from('100'))
 * ```
 *
 * @since 0.0.1
 */
export const from = (value: bigint | number | string): Effect.Effect<NonceType, UintError> =>
  Effect.try({
    try: () => Uint.from(value) as unknown as NonceType,
    catch: (e) => e as UintError
  })
