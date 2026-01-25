import { Rlp as VoltaireRlp } from '@tevm/voltaire/Rlp'
import * as Effect from 'effect/Effect'

/**
 * Validates if data is valid RLP encoding.
 *
 * @param data - Data to validate
 * @returns Effect that succeeds with boolean indicating validity (infallible)
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { validate } from 'voltaire-effect/primitives/Rlp'
 *
 * const valid = Effect.runSync(validate(new Uint8Array([0x83, 1, 2, 3])))
 * // => true
 *
 * const invalid = Effect.runSync(validate(new Uint8Array([0x83, 1])))
 * // => false (incomplete)
 * ```
 *
 * @since 0.0.1
 */
export const validate = (data: Uint8Array): Effect.Effect<boolean> =>
  Effect.sync(() => VoltaireRlp.validate(data))
